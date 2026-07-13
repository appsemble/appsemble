import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import { formatPath, getPath, pathContains } from './path.js';
import {
  childSchema,
  localShapeFactory,
  type DynamicChild,
  resolve,
  resolveChild,
  type ResolveContext,
  type ResolveOptions,
} from './resolve.js';
import { SchemaRegistry } from './schemaRegistry.js';
import {
  COMPONENT_KEY,
  type ScanHit,
  type Identity,
  type Mount,
  type NodePath,
  schemaTag,
} from './types.js';

/**
 * Language component analyzer: one structural walk builds the whole tree, descending
 * only into winning branches via the decision core in `resolve.ts`.
 *
 * The walk reaches everything Appsemble's OpenAPI 3.0 schemas can express. It cannot
 * reach language components placed behind conditional/pattern applicators (`if`/`then`,
 * `patternProperties`), which those schemas do not support; if they ever appear, a
 * walk-driven local probe would cover them (see PERFORMANCE.md).
 *
 * `Scanner` splits tree building (`buildTree`, the walk) from document validation
 * (`validate`, `collectHits` -> `documentValid` + `errors`); `scan` runs both.
 * `buildTree` reuses a prior tree, re-walking only the subtrees enclosing the changed
 * paths (see `boundaryFor`), so a per-edit re-analysis is near-free (see PERFORMANCE.md).
 */

interface WalkContext extends ResolveContext {
  emit: (path: NodePath, identity: Identity, localValid: boolean) => void;
}

// The identity tree: mounts keyed by JSON Pointer over the analyzed document, with `mountAt` to
// look one up by a structured data path (so callers never stringify a path themselves). Mounts
// carry `localValid` but no document errors — those come from `validate` — and no value: values
// are derived on demand via `valueAt`, so reused mounts stay fresh across incremental rebuilds.
// This is what `buildTree` produces and reuses.
export class MountTree {
  readonly mounts: Map<string, Mount>;

  readonly data: unknown;

  constructor(mounts: Map<string, Mount>, data: unknown) {
    this.mounts = mounts;
    this.data = data;
  }

  // The mount at a data path, or undefined when nothing mounted there.
  mountAt(path: NodePath): Mount | undefined {
    return this.mounts.get(formatPath(path));
  }

  // The document value at a data path (a mount's `path`, typically), or undefined.
  valueAt(path: NodePath): unknown {
    return getPath(this.data, path);
  }
}

// The identity tree plus whole-document validity: a `MountTree` (so it carries `mountAt`) with the
// document's `documentValid` and the tooling `hits`. Each mount's `errors` are scoped at or below
// its path. This is what `scan` / `Scanner.run` produce.
export class ScanResult extends MountTree {
  readonly documentValid: boolean;

  readonly hits: ScanHit[];

  constructor(mounts: Map<string, Mount>, data: unknown, documentValid: boolean, hits: ScanHit[]) {
    super(mounts, data);
    this.documentValid = documentValid;
    this.hits = hits;
  }
}

// Whole-document validation, separate from tree building.
export interface ScanValidation {
  documentValid: boolean;
  errors: ValidationError[];
  hits: ScanHit[];
}

export interface IncrementalOptions {
  previous?: MountTree;
  changed?: NodePath[];
}

// A re-walk root for incremental analysis: a subtree (the schema at a path) to re-analyze
// because an edit fell at or below it. Boundaries sit at `$ref` cutoffs (see `boundaryFor`).
interface Boundary {
  path: NodePath;
  schema: Schema;
}

function walk(schema: Schema, value: unknown, path: NodePath, ctx: WalkContext): void {
  const { identity, winners, matched } = resolve(schema, value, ctx);
  if (identity) {
    ctx.emit(path, identity, matched);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const child = resolveChild(ctx, identity?.name ?? null, value, key, winners);
      if (child) {
        walk(child, (value as Record<string, unknown>)[key], [...path, key], ctx);
      }
    }
  }
}

function collectHits(
  validator: Validator,
  data: unknown,
  rootSchema: Schema,
): { hits: ScanHit[]; documentValid: boolean; errors: ValidationError[] } {
  const hits: ScanHit[] = [];
  // eslint-disable-next-line no-param-reassign
  validator.attributes[COMPONENT_KEY] = (instance, currentSchema, options, context) => {
    const tag = schemaTag(currentSchema);
    if (instance !== undefined && tag) {
      hits.push({ path: context.path, schema: currentSchema, tag });
    }
    return undefined as never;
  };
  const result = validator.validate(data, rootSchema, { base: '#', nestedErrors: true });
  return { documentValid: result.valid, errors: result.errors, hits };
}

/**
 * A schema set compiled once and reused across analyses: the registry, resolve
 * validator, and ref-cutoff cache are keyed on the fixed schema set.
 */
export class Scanner {
  private readonly registry: SchemaRegistry;

  // Clean validator for the walk's local checks; never carries the hit side effect.
  private readonly resolveValidator: Validator;

  // Persistent ref-cutoff cache, keyed on schema identity (stable across calls).
  private readonly localShape: (schema: Schema) => Schema;

  // Value-directed child resolver consulted before structural descent (see DynamicChild).
  private readonly dynamicChild?: DynamicChild;

  constructor(schemas: Record<string, Schema>, options: ResolveOptions = {}) {
    this.registry = new SchemaRegistry(schemas);
    this.resolveValidator = this.registry.createValidator();
    this.localShape = localShapeFactory();
    this.dynamicChild = options.dynamicChild;
  }

  /**
   * One-shot analysis: compile the schema set and `scan` in a single call. Use this for a
   * throwaway analysis; construct a `Scanner` and reuse it when analyzing repeatedly, so the
   * registry, validator, and ref-cutoff cache are compiled once.
   *
   * @param schemas The schema set to compile.
   * @param data The document to analyze.
   * @param rootSchema The root schema the document is walked and validated against.
   * @param options The value-directed resolver (see ResolveOptions).
   * @returns The combined identity tree plus document validity.
   */
  static run(
    schemas: Record<string, Schema>,
    data: unknown,
    rootSchema: Schema,
    options?: ResolveOptions,
  ): ScanResult {
    return new Scanner(schemas, options).scan(data, rootSchema);
  }

  /**
   * Build the identity tree from the structural walk. With `previous` + `changed`,
   * re-walk only the subtrees enclosing the changed paths and reuse the rest.
   *
   * @param data The document to analyze.
   * @param rootSchema The root schema the document is walked against.
   * @param options Optional prior tree plus changed paths, for incremental reuse.
   * @returns The identity tree: the per-path `mounts` map.
   */
  buildTree(data: unknown, rootSchema: Schema, options?: IncrementalOptions): MountTree {
    if (options?.previous && options.changed?.length) {
      return this.incremental(data, rootSchema, options.previous, options.changed);
    }
    const byPath = new Map<string, Mount>();
    walk(rootSchema, data, [], this.walkContext(byPath));
    return new MountTree(byPath, data);
  }

  /**
   * Whole-document validation, separate from tree building. Uses its own validator
   * because collecting hits installs a side effect the resolve validator must avoid.
   *
   * @param data The document to validate.
   * @param rootSchema The root schema to validate against.
   * @returns Whole-document validity, the validation errors, and collected hits.
   */
  validate(data: unknown, rootSchema: Schema): ScanValidation {
    const { documentValid, errors, hits } = collectHits(
      this.registry.createValidator(),
      data,
      rootSchema,
    );
    return { documentValid, errors, hits };
  }

  /**
   * Combined result in the original shape: the identity tree plus document validity,
   * with each mount's errors scoped to at or below its path.
   *
   * @param data The document to analyze.
   * @param rootSchema The root schema the document is walked and validated against.
   * @param options Optional prior tree plus changed paths, for incremental reuse.
   * @returns The identity tree plus document validity, in the combined shape.
   */
  scan(data: unknown, rootSchema: Schema, options?: IncrementalOptions): ScanResult {
    const tree = this.buildTree(data, rootSchema, options);
    const { documentValid, errors, hits } = this.validate(data, rootSchema);
    const mounts = new Map(
      [...tree.mounts].map(([key, mount]) => [
        key,
        { ...mount, errors: errors.filter((error) => pathContains(mount.path, error.path)) },
      ]),
    );
    return new ScanResult(mounts, data, documentValid, hits);
  }

  // Everything the decision core needs to resolve and descend, with no emit sink. Used
  // directly by `boundaryFor`, which navigates without producing mounts.
  private resolveContext(): ResolveContext {
    return {
      resolveRef: (ref) => this.registry.resolveRef(ref),
      localShape: this.localShape,
      dynamicChild: this.dynamicChild,
      validator: this.resolveValidator,
    };
  }

  // The resolve context plus the walk's emit sink, which records a mount per resolved node.
  private walkContext(byPath: Map<string, Mount>): WalkContext {
    return {
      ...this.resolveContext(),
      emit(path, identity, localValid) {
        byPath.set(formatPath(path), { errors: [], localValid, identity, path });
      },
    };
  }

  private incremental(
    data: unknown,
    rootSchema: Schema,
    previous: MountTree,
    changed: NodePath[],
  ): MountTree {
    const boundaries = this.boundaries(rootSchema, data, changed);
    const byPath = new Map<string, Mount>();
    // The new tree is pure set algebra: reused mounts (outside every boundary) plus
    // re-walked mounts. Mounts carry no values, so reuse cannot go stale — values are
    // derived from the new document through `valueAt`.
    for (const mount of previous.mounts.values()) {
      if (!boundaries.some((boundary) => pathContains(boundary.path, mount.path))) {
        byPath.set(formatPath(mount.path), mount);
      }
    }
    for (const boundary of boundaries) {
      walk(boundary.schema, getPath(data, boundary.path), boundary.path, this.walkContext(byPath));
    }
    return new MountTree(byPath, data);
  }

  // Outermost re-walk roots for the changed paths: deduplicate by path, then drop any
  // boundary contained by another so overlapping edits re-walk their subtree once.
  private boundaries(rootSchema: Schema, data: unknown, changed: NodePath[]): Boundary[] {
    const unique = new Map(
      changed.map((path) => {
        const boundary = this.boundaryFor(rootSchema, data, path);
        return [formatPath(boundary.path), boundary];
      }),
    );
    const list = [...unique.values()];
    return list.filter(
      (boundary) =>
        !list.some((other) => other !== boundary && pathContains(other.path, boundary.path)),
    );
  }

  /**
   * The nearest enclosing `$ref` boundary at or above `target`. The ref-cutoff makes a
   * node's resolution depend on its value only down to the next ref, so re-walking from
   * here is complete. Falls back to the root when the path crosses no ref.
   *
   * @param rootSchema The root schema to descend from.
   * @param data The document, navigated alongside the schema.
   * @param target The changed data path to bound.
   * @returns The nearest enclosing `$ref` boundary path and its schema.
   */
  private boundaryFor(rootSchema: Schema, data: unknown, target: NodePath): Boundary {
    const ctx = this.resolveContext();
    let schema = rootSchema;
    let value: unknown = data;
    let path: NodePath = [];
    let boundary: Boundary = { path: [], schema: rootSchema };
    for (const key of target) {
      const { winners } = resolve(schema, value, ctx);
      const child = childSchema(winners, String(key), ctx.resolveRef);
      if (!child) {
        break;
      }
      const next = value == null ? undefined : (value as Record<number | string, unknown>)[key];
      // Value absent in the new document (a removal): the enclosing boundary covers it;
      // descending further would re-walk a phantom node at a path that no longer exists.
      if (next === undefined) {
        break;
      }
      path = [...path, key];
      value = next;
      schema = child;
      if (child.$ref) {
        boundary = { path, schema: child };
      }
    }
    return boundary;
  }
}
