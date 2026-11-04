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

// Binding hooks that take the resolved `Node` (dispatched by the walk) — excludes `getExtraAnnotations`,
// which is keyed by scope, not node, and read via `LanguageCtx.bindingFor`.
export type NodeBindingHook = 'validate' | 'complete' | 'describe';

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

  // The nearest enclosing component at `path` whose binding has `hook` (any binding when omitted),
  // plus its node and the paths around it. `path` may run past the document, as a completion for an
  // element not written yet does: the search starts from the deepest node that exists.
  bindingContextAt(path: NodePath, hook?: NodeBindingHook): BindingContext | undefined {
    let node = this.ctx.root(this.data) as Node;
    for (const key of path) {
      const next = node.child(key);
      if (!next) {
        break;
      }
      node = next;
    }
    return this.ctx.bindingContextFor(node, hook, path);
  }

  // Dispatch one hook of the nearest enclosing component that defines it. Undefined when none does.
  // Only the hooks that take
  // the resolved `Node` are dispatchable here; `getExtraAnnotations` is read by scope, not by node.
  callBindingAt<Hook extends NodeBindingHook>(
    path: NodePath,
    hook: Hook,
  ): ReturnType<NonNullable<LanguageComponentBinding[Hook]>> | undefined {
    const context = this.bindingContextAt(path, hook);
    const fn = context?.binding[hook];
    return fn
      ? (fn(context!, this.ctx.context) as ReturnType<NonNullable<LanguageComponentBinding[Hook]>>)
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

// The async twin of `walk`: identical descent, but before each child step it `await`s the context's
// `loadDynamicChild` so a value-directed child backed by an async source (a block manifest) is loaded
// inline, then resolved synchronously by the same `childNode`. The load happens per child right before
// the sync step — never a prime-everything-first pass (which is what we deliberately avoid). A context
// without `loadDynamicChild` degrades to `walk` with extra awaits on resolved promises.
async function walkAsync(
  schema: Schema,
  value: unknown,
  path: NodePath,
  ctx: WalkContext,
): Promise<void> {
  const resolution = resolve(schema, value, ctx);
  const { identity, matched, localErrors } = resolution;
  if (identity) {
    ctx.emit(path, identity, matched, localErrors ?? []);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      await ctx.loadDynamicChild?.(identity?.name ?? null, value, key);
      const child = childNode(value, path, resolution, key, ctx);
      if (child) {
        await walkAsync(child.schema, child.value, child.path, ctx);
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

// Attach whole-document validity to a built tree: each mount keeps the errors at or below its path.
// Shared by the sync and async scans so they scope identically.
function scoped(ctx: LanguageCtx, tree: MountIndex, data: unknown): ScanResult {
  const { documentValid, errors, hits } = ctx.validate(data);
  const mounts = new Map(
    [...tree.mounts].map(([key, mount]) => [
      key,
      { ...mount, errors: errors.filter((error) => pathContains(mount.path, error.path)) },
    ]),
  );
  return new ScanResult(ctx, mounts, data, documentValid, hits);
}

// Combined analysis: the identity tree plus whole-document validity, each mount's errors scoped at or
// below its path.
export function scan(ctx: LanguageCtx, data: unknown, options?: IncrementalOptions): ScanResult {
  const tree = buildTree(ctx, data, options);
  return scoped(ctx, tree, data);
}

// The full-walk identity tree via the async descent (`walkAsync`), awaiting each value-directed child
// load inline. No incremental path — the async walk is the whole-document pass (validation, vAD), not
// the per-edit rebuild, which stays sync through `buildTree`.
export async function buildTreeAsync(ctx: LanguageCtx, data: unknown): Promise<MountIndex> {
  const byPath = new Map<string, Mount>();
  await walkAsync(ctx.rootSchema, data, [], walkContext(ctx, byPath));
  return new MountIndex(ctx, byPath, data);
}

// The async twin of `scan`: builds the tree via `buildTreeAsync` (so async-loaded dynamic children are
// mounted), then attaches the same whole-document validity. For a consumer that must await block
// manifests before the document is fully known (e.g. the ported `validateAppDefinition`).
export async function scanAsync(ctx: LanguageCtx, data: unknown): Promise<ScanResult> {
  const tree = await buildTreeAsync(ctx, data);
  return scoped(ctx, tree, data);
}
