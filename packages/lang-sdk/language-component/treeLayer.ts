import { type Schema, type ValidationError } from 'jsonschema';

import type { LanguageComponentBinding } from './languageComponent.js';
import type { LanguageCtx } from './languageCtx.js';
import type { Node } from './node.js';
import { formatPath, getPath, pathContains } from './path.js';
import { childNode, resolve, type ResolveContext } from './resolve.js';
import { type Identity, type Mount, type NodePath, type ScanHit } from './types.js';

/**
 * The tree layer: stateless functions over the shared descent step (`resolve`/`childNode`). `walk`
 * builds the whole tree, descending only into winning branches; incremental rebuilds re-walk only
 * the subtrees enclosing the changed paths (bounded by the nearest `$ref`, via `Node.boundaryAt`)
 * and reuse the rest, so a per-edit re-analysis is near-free (PERFORMANCE.md).
 *
 * The walk cannot reach components behind conditional/pattern applicators (`if`/`then`,
 * `patternProperties`), which the Appsemble schemas don't use; blocks go through the `dynamicChild`
 * hook (BLOCKS.md).
 */

interface WalkContext extends ResolveContext {
  emit: (
    path: NodePath,
    identity: Identity,
    localValid: boolean,
    localErrors: ValidationError[],
  ) => void;
}

export interface IncrementalOptions {
  previous?: MountIndex;
  changed?: NodePath[];
}

// A re-walk root: the subtree (schema at a path) to re-analyze after an edit at or below it.
// Boundaries sit at `$ref` cutoffs (see `Node.boundaryAt`).
interface Boundary {
  path: NodePath;
  schema: Schema;
}

// The nearest enclosing component at a path plus its location: the node the binding runs on, the
// component's absolute path, and the remaining path to the cursor.
export interface BindingContext {
  node: Node;
  binding: LanguageComponentBinding;
  componentPath: NodePath;
  relativePath: NodePath;
}

/**
 * The identity tree: mounts keyed by JSON Pointer, holding its `LanguageCtx` so it can navigate
 * (`nodeAt`) and dispatch bindings (`callBindingAt`). Mounts carry `localValid` but no document
 * errors (those come from `LanguageCtx.validate`) and no value — values are derived on demand via
 * `valueAt`, so mounts reused across incremental rebuilds can't go stale.
 */
export class MountIndex {
  readonly mounts: Map<string, Mount>;

  readonly data: unknown;

  private readonly ctx: LanguageCtx;

  constructor(ctx: LanguageCtx, mounts: Map<string, Mount>, data: unknown) {
    this.ctx = ctx;
    this.mounts = mounts;
    this.data = data;
  }

  // The mount at a path (sparse: identity only), or undefined.
  mountAt(path: NodePath): Mount | undefined {
    return this.mounts.get(formatPath(path));
  }

  // The document value at a path, or undefined.
  valueAt(path: NodePath): unknown {
    return getPath(this.data, path);
  }

  // A navigable node at ANY path (not only mount points), or undefined. Rebuilt per call.
  nodeAt(path: NodePath): Node | undefined {
    return this.ctx.root(this.data).cursorAt(path) ?? undefined;
  }

  // The nearest enclosing component at `path` (the longest mounted prefix with a registered
  // binding), plus its node and the paths around it.
  bindingContextAt(path: NodePath): BindingContext | undefined {
    let best: Mount | undefined;
    for (const mount of this.mounts.values()) {
      if (
        this.ctx.binds.has(mount.identity.name) &&
        pathContains(mount.path, path) &&
        (!best || mount.path.length > best.path.length)
      ) {
        best = mount;
      }
    }
    if (!best) {
      return undefined;
    }
    const node = this.nodeAt(best.path);
    const binding = this.ctx.binds.get(best.identity.name);
    if (!node || !binding) {
      return undefined;
    }
    return {
      node,
      binding,
      componentPath: best.path,
      relativePath: path.slice(best.path.length),
    };
  }

  // Dispatch one hook of the nearest enclosing component's binding at `path`. Undefined when no
  // bound component encloses `path` or that binding does not define the hook.
  callBindingAt<Hook extends keyof LanguageComponentBinding>(
    path: NodePath,
    hook: Hook,
  ): ReturnType<NonNullable<LanguageComponentBinding[Hook]>> | undefined {
    const context = this.bindingContextAt(path);
    const fn = context?.binding[hook];
    return fn
      ? (fn(context!.node) as ReturnType<NonNullable<LanguageComponentBinding[Hook]>>)
      : undefined;
  }
}

/**
 * The identity tree plus whole-document validity: a `MountIndex` with `documentValid` and the
 * tooling `hits`. Each mount's `errors` are scoped at or below its path. This is what `scan` produces.
 */
export class ScanResult extends MountIndex {
  readonly documentValid: boolean;

  readonly hits: ScanHit[];

  constructor(
    ctx: LanguageCtx,
    mounts: Map<string, Mount>,
    data: unknown,
    documentValid: boolean,
    hits: ScanHit[],
  ) {
    super(ctx, mounts, data);
    this.documentValid = documentValid;
    this.hits = hits;
  }
}

function walk(schema: Schema, value: unknown, path: NodePath, ctx: WalkContext): void {
  const resolution = resolve(schema, value, ctx);
  const { identity, matched, localErrors } = resolution;
  if (identity) {
    ctx.emit(path, identity, matched, localErrors ?? []);
  }
  if (value && typeof value === 'object') {
    // Step over transient child frames, never a `Node` per document node (perf guardrail).
    for (const key of Object.keys(value)) {
      const child = childNode(value, path, resolution, key, ctx);
      if (child) {
        walk(child.schema, child.value, child.path, ctx);
      }
    }
  }
}

function walkContext(ctx: LanguageCtx, byPath: Map<string, Mount>): WalkContext {
  return {
    ...ctx.resolveContext(),
    emit(path, identity, localValid, localErrors) {
      byPath.set(formatPath(path), { errors: [], localErrors, localValid, identity, path });
    },
  };
}

// Fold each changed path to its nearest `$ref` boundary, dedupe, then drop any boundary contained by
// another so overlapping edits re-walk their subtree once.
function rewalkBoundaries(ctx: LanguageCtx, data: unknown, changed: NodePath[]): Boundary[] {
  const root = ctx.root(data);
  const unique = new Map(
    changed.map((path) => {
      const boundary = root.boundaryAt(path);
      return [formatPath(boundary.path), { path: boundary.path, schema: boundary.comp }];
    }),
  );
  const list = [...unique.values()];
  return list.filter(
    (boundary) =>
      !list.some((other) => other !== boundary && pathContains(other.path, boundary.path)),
  );
}

function incremental(
  ctx: LanguageCtx,
  data: unknown,
  previous: MountIndex,
  changed: NodePath[],
): MountIndex {
  const bounds = rewalkBoundaries(ctx, data, changed);
  const byPath = new Map<string, Mount>();
  // Set algebra: reused mounts (outside every boundary) + re-walked mounts. Mounts carry no value,
  // so reuse can't go stale — values are derived from the new document via `valueAt`.
  for (const mount of previous.mounts.values()) {
    if (!bounds.some((boundary) => pathContains(boundary.path, mount.path))) {
      byPath.set(formatPath(mount.path), mount);
    }
  }
  for (const boundary of bounds) {
    walk(boundary.schema, getPath(data, boundary.path), boundary.path, walkContext(ctx, byPath));
  }
  return new MountIndex(ctx, byPath, data);
}

// Build the identity tree via the structural walk. With `previous` + `changed`, re-walk only the
// subtrees enclosing the changed paths and reuse the rest.
export function buildTree(
  ctx: LanguageCtx,
  data: unknown,
  options?: IncrementalOptions,
): MountIndex {
  if (options?.previous && options.changed?.length) {
    return incremental(ctx, data, options.previous, options.changed);
  }
  const byPath = new Map<string, Mount>();
  walk(ctx.rootSchema, data, [], walkContext(ctx, byPath));
  return new MountIndex(ctx, byPath, data);
}

// Combined analysis: the identity tree plus whole-document validity, each mount's errors scoped at or
// below its path.
export function scan(ctx: LanguageCtx, data: unknown, options?: IncrementalOptions): ScanResult {
  const tree = buildTree(ctx, data, options);
  const { documentValid, errors, hits } = ctx.validate(data);
  const mounts = new Map(
    [...tree.mounts].map(([key, mount]) => [
      key,
      { ...mount, errors: errors.filter((error) => pathContains(mount.path, error.path)) },
    ]),
  );
  return new ScanResult(ctx, mounts, data, documentValid, hits);
}
