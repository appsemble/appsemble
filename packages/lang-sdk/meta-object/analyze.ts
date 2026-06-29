import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import { formatPath, getPath } from './path.js';
import { MetaSchemaRegistry } from './schemaRegistry.js';
import {
  META_KEY,
  type MetaHit,
  type MetaIdentity,
  type MetaInterpretation,
  type MetaObjectPath,
  type MetaTag,
  metaTag,
} from './types.js';

/**
 * Meta-object analyzer: one structural walk builds the whole tree. `resolve` is the
 * single place a oneOf/anyOf/allOf is decided, returning the identity and the
 * concrete winner schema(s); `governingChild` then does pure structural lookup on
 * those winners to descend, so the walk only ever follows winning branches.
 *
 * The walk reaches everything Appsemble's OpenAPI 3.0 schemas can express. It cannot
 * reach meta-objects placed behind conditional/pattern applicators (`if`/`then`,
 * `patternProperties`), which those schemas do not support; if they ever appear, a
 * walk-driven local probe would cover them (see PERFORMANCE.md).
 *
 * `MetaAnalyzer` splits tree building (`buildTree`, the walk) from document validation
 * (`validate`, `collectHits` -> `documentValid` + `errors`); `analyze` runs both.
 * `buildTree` reuses a prior tree, re-walking only the subtrees enclosing the changed
 * paths (see `boundaryFor`), so a per-edit re-analysis is near-free (see PERFORMANCE.md).
 */

export interface Resolution {
  identity: MetaIdentity | null;
  winners: Schema[];
  matched: boolean;
}

// Everything `resolve` and `governingChild` need to decide identity and descend, minus
// the walk's emit sink. The cursor (interactive navigation) reuses this same context.
export interface ResolveContext {
  resolveRef: (ref: string) => Schema;
  validator: Validator;
  shallow: (schema: Schema) => Schema;
  metaKey: string;
}

interface WalkContext extends ResolveContext {
  emit: (path: MetaObjectPath, object: MetaIdentity, localValid: boolean) => void;
}

export interface MetaAnalysisResult {
  documentValid: boolean;
  hits: MetaHit[];
  interpretations: Map<string, MetaInterpretation>;
}

// The identity tree alone: interpretations carry `localValid` but no document errors
// (those come from `validate`). Keyed by JSON Pointer; the identity is `.identity`. This
// is what `buildTree` produces and reuses.
export interface MetaTree {
  interpretations: Map<string, MetaInterpretation>;
}

// Whole-document validation, separate from tree building.
export interface MetaValidation {
  documentValid: boolean;
  errors: ValidationError[];
  hits: MetaHit[];
}

export interface IncrementalOptions {
  previous?: MetaTree;
  changed?: MetaObjectPath[];
}

function single(name: string): MetaIdentity {
  return { kind: 'single', name, parts: [] };
}

function unresolved(reason: string, parts: MetaIdentity[] = []): MetaIdentity {
  return { kind: 'unresolved', name: 'UnresolvedMetaObject', parts, reason };
}

function composite(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  tag: MetaTag | undefined,
  parts: MetaIdentity[],
): MetaIdentity {
  return { kind: 'composite', mode, name: tag?.name ?? mode, parts };
}

function deref(schema: Schema, resolveRef: (ref: string) => Schema): Schema {
  return schema.$ref ? deref(resolveRef(schema.$ref), resolveRef) : schema;
}

// Performance. Without the ref-cutoff below, resolve() validated each node against
// its full schema and jsonschema follows $refs, so a node's subtree was re-validated
// inside every ancestor's validation -- O(N x nesting-depth), seconds on a medium app.
//
// The ref-cutoff makes per-node validation local (see `stripRefs`), which is the
// dominant win. A per-run memo of validates() by (value, schema) identity was tried
// and made no measurable difference on real apps (the costly validations are all
// distinct, not repeated), so it was dropped. The remaining cost is the single
// full-ref validation pass below (document validity, errors, hits) plus validator
// construction; optimize those next if the profile demands it.
function validates(validator: Validator, value: unknown, schema: Schema): boolean {
  return validator.validate(value, schema, { base: '#', nestedErrors: true }).valid;
}

// Ref-cutoff: a copy of a schema with every nested $ref replaced by accept-all, so
// validating against it checks only the schema's own local shape and never recurses
// into referenced subtrees (the walk visits those). Nested `oneOf` is relaxed to
// `anyOf` because accept-all branches make exact-one vacuously false; exclusivity is
// not needed to recognize local shape.
function stripRefs(schema: Schema): Schema {
  if (schema.$ref) {
    return {};
  }
  const copy: Schema = { ...schema };
  if (copy.properties) {
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([key, value]) => [key, stripRefs(value)]),
    );
  }
  if (copy.items && typeof copy.items === 'object') {
    copy.items = Array.isArray(copy.items) ? copy.items.map(stripRefs) : stripRefs(copy.items);
  }
  if (copy.additionalProperties && typeof copy.additionalProperties === 'object') {
    copy.additionalProperties = stripRefs(copy.additionalProperties);
  }
  if (copy.allOf) {
    copy.allOf = copy.allOf.map(stripRefs);
  }
  if (copy.anyOf) {
    copy.anyOf = copy.anyOf.map(stripRefs);
  }
  if (copy.oneOf) {
    copy.anyOf = [...(copy.anyOf ?? []), ...copy.oneOf.map(stripRefs)];
    delete copy.oneOf;
  }
  return copy;
}

export function createShallow(): (schema: Schema) => Schema {
  const cache = new Map<Schema, Schema>();
  return (schema) => {
    let cached = cache.get(schema);
    if (!cached) {
      cached = stripRefs(schema);
      cache.set(schema, cached);
    }
    return cached;
  };
}

function metaParts(parts: Resolution[]): MetaIdentity[] {
  return parts
    .map((part) => part.identity)
    .filter((object): object is MetaIdentity => object != null);
}

function pathContains(parent: MetaObjectPath, child: MetaObjectPath): boolean {
  // Compare by string value: a path segment means the same key whether it arrives as a
  // number (array index from a caller's diff) or a string (the walk's Object.keys).
  return (
    parent.length <= child.length &&
    parent.every((part, index) => String(part) === String(child[index]))
  );
}

export function governingChild(
  winners: Schema[],
  key: string,
  resolveRef: (ref: string) => Schema,
): Schema | null {
  const owned: Schema[] = [];
  for (const winner of winners) {
    const schema = deref(winner, resolveRef);
    if (schema.properties && Object.hasOwn(schema.properties, key)) {
      owned.push(schema.properties[key]);
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      owned.push(schema.additionalProperties);
    } else if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
      owned.push(schema.items);
    }
  }
  if (owned.length === 0) {
    return null;
  }
  return owned.length === 1 ? owned[0] : { allOf: owned };
}

export function resolve(schema: Schema, value: unknown, ctx: ResolveContext): Resolution {
  const s = deref(schema, ctx.resolveRef);
  const tag = metaTag(s, ctx.metaKey);

  if (s.oneOf) {
    const parts = s.oneOf.map((branch) => resolve(branch, value, ctx));
    const matched = parts.filter((part) => part.matched);
    if (matched.length === 1) {
      const [winner] = matched;
      const identity = tag ? composite('oneOf', tag, metaParts([winner])) : winner.identity;
      return { identity, matched: true, winners: winner.winners };
    }
    const found = metaParts(matched);
    const identity =
      tag || found.length
        ? unresolved(`oneOf expected exactly one match, got ${matched.length}`, found)
        : null;
    return { identity, matched: false, winners: [] };
  }

  if (s.anyOf) {
    const parts = s.anyOf.map((branch) => resolve(branch, value, ctx));
    const matched = parts.filter((part) => part.matched);
    if (matched.length) {
      const found = metaParts(matched);
      const identity = tag || found.length ? composite('anyOf', tag, found) : null;
      return { identity, matched: true, winners: matched.flatMap((part) => part.winners) };
    }
    return {
      identity: tag ? unresolved('anyOf matched nothing') : null,
      matched: false,
      winners: [],
    };
  }

  if (s.allOf) {
    const parts = s.allOf.map((branch) => resolve(branch, value, ctx));
    const found = metaParts(parts);
    if (parts.every((part) => part.matched)) {
      const identity = tag || found.length ? composite('allOf', tag, found) : null;
      return { identity, matched: true, winners: parts.flatMap((part) => part.winners) };
    }
    const identity = tag || found.length ? unresolved('allOf did not fully match', found) : null;
    return { identity, matched: false, winners: [] };
  }

  // Leaf/object schema: its own properties govern children regardless of validity.
  // Validate only the local shape (ref-cutoff); the walk visits referenced subtrees.
  // A tagged object keeps its identity even when it fails its own constraints; the
  // failure surfaces through localValid and the attached errors, never by erasing
  // the object (mirroring how a oneOf winner keeps identity under an outer if/then).
  const matched = validates(ctx.validator, value, ctx.shallow(s));
  const identity = tag ? single(tag.name) : null;
  return { identity, matched, winners: [s] };
}

function walk(schema: Schema, value: unknown, path: MetaObjectPath, ctx: WalkContext): void {
  const { identity, winners, matched } = resolve(schema, value, ctx);
  if (identity) {
    ctx.emit(path, identity, matched);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const childSchema = governingChild(winners, key, ctx.resolveRef);
      if (childSchema) {
        walk(childSchema, (value as Record<string, unknown>)[key], [...path, key], ctx);
      }
    }
  }
}

function collectHits(
  validator: Validator,
  data: unknown,
  rootSchema: Schema,
  metaKey: string,
): { hits: MetaHit[]; documentValid: boolean; errors: ValidationError[] } {
  const hits: MetaHit[] = [];
  // eslint-disable-next-line no-param-reassign
  validator.attributes[metaKey] = (instance, currentSchema, options, context) => {
    const tag = metaTag(currentSchema, metaKey);
    if (instance !== undefined && tag) {
      hits.push({ path: context.path, schema: currentSchema, tag });
    }
    return undefined as never;
  };
  const result = validator.validate(data, rootSchema, { base: '#', nestedErrors: true });
  return { documentValid: result.valid, errors: result.errors, hits };
}

function treeFrom(byPath: Map<string, MetaInterpretation>): MetaTree {
  return { interpretations: byPath };
}

/**
 * A schema set compiled once and reused across analyses: the registry, resolve
 * validator, and ref-cutoff cache are keyed on the fixed schema set.
 */
export class MetaAnalyzer {
  private readonly registry: MetaSchemaRegistry;

  // Clean validator for the walk's local checks; never carries the hit side effect.
  private readonly resolveValidator: Validator;

  // Persistent ref-cutoff cache, keyed on schema identity (stable across calls).
  private readonly shallow: (schema: Schema) => Schema;

  // The schema keyword identities are read from (defaults to META_KEY).
  private readonly metaKey: string;

  constructor(schemas: Record<string, Schema>, metaKey: string = META_KEY) {
    this.registry = new MetaSchemaRegistry(schemas);
    this.resolveValidator = this.registry.createValidator();
    this.shallow = createShallow();
    this.metaKey = metaKey;
  }

  /**
   * Build the identity tree from the structural walk. With `previous` + `changed`,
   * re-walk only the subtrees enclosing the changed paths and reuse the rest.
   *
   * @param data The document to analyze.
   * @param rootSchema The root schema the document is walked against.
   * @param options Optional prior tree plus changed paths, for incremental reuse.
   * @returns The identity tree: the per-path `interpretations` map.
   */
  buildTree(data: unknown, rootSchema: Schema, options?: IncrementalOptions): MetaTree {
    if (options?.previous && options.changed?.length) {
      return this.incremental(data, rootSchema, options.previous, options.changed);
    }
    const byPath = new Map<string, MetaInterpretation>();
    walk(rootSchema, data, [], this.emitInto(byPath, data));
    return treeFrom(byPath);
  }

  /**
   * Whole-document validation, separate from tree building. Uses its own validator
   * because collecting hits installs a side effect the resolve validator must avoid.
   *
   * @param data The document to validate.
   * @param rootSchema The root schema to validate against.
   * @returns Whole-document validity, the validation errors, and collected hits.
   */
  validate(data: unknown, rootSchema: Schema): MetaValidation {
    const { documentValid, errors, hits } = collectHits(
      this.registry.createValidator(),
      data,
      rootSchema,
      this.metaKey,
    );
    return { documentValid, errors, hits };
  }

  /**
   * Combined result in the original shape: the identity tree plus document validity,
   * with each interpretation's errors scoped to at or below its path.
   *
   * @param data The document to analyze.
   * @param rootSchema The root schema the document is walked and validated against.
   * @param options Optional prior tree plus changed paths, for incremental reuse.
   * @returns The identity tree plus document validity, in the combined shape.
   */
  analyze(data: unknown, rootSchema: Schema, options?: IncrementalOptions): MetaAnalysisResult {
    const tree = this.buildTree(data, rootSchema, options);
    const { documentValid, errors, hits } = this.validate(data, rootSchema);
    const interpretations = new Map(
      [...tree.interpretations].map(([key, interpretation]) => [
        key,
        {
          ...interpretation,
          errors: errors.filter((error) => pathContains(interpretation.path, error.path)),
        },
      ]),
    );
    return { documentValid, hits, interpretations };
  }

  private emitInto(byPath: Map<string, MetaInterpretation>, data: unknown): WalkContext {
    return {
      emit(path, object, localValid) {
        byPath.set(formatPath(path), {
          errors: [],
          localValid,
          identity: object,
          path,
          value: getPath(data, path),
        });
      },
      resolveRef: (ref) => this.registry.resolveRef(ref),
      shallow: this.shallow,
      metaKey: this.metaKey,
      validator: this.resolveValidator,
    };
  }

  private incremental(
    data: unknown,
    rootSchema: Schema,
    previous: MetaTree,
    changed: MetaObjectPath[],
  ): MetaTree {
    const boundaries = this.boundaries(rootSchema, data, changed);
    const byPath = new Map<string, MetaInterpretation>();
    // Reuse every prior interpretation not inside a re-walked boundary.
    for (const interpretation of previous.interpretations.values()) {
      if (!boundaries.some((boundary) => pathContains(boundary.path, interpretation.path))) {
        byPath.set(formatPath(interpretation.path), interpretation);
      }
    }
    // Re-walk each affected subtree from its enclosing boundary.
    for (const boundary of boundaries) {
      walk(
        boundary.schema,
        getPath(data, boundary.path),
        boundary.path,
        this.emitInto(byPath, data),
      );
      // A reused ancestor of the boundary keeps its identity but its value subtree
      // changed; refresh its value (cloning, so the previous tree stays intact).
      for (let depth = 0; depth < boundary.path.length; depth += 1) {
        const ancestorPath = boundary.path.slice(0, depth);
        const key = formatPath(ancestorPath);
        const reused = byPath.get(key);
        if (reused) {
          byPath.set(key, { ...reused, value: getPath(data, ancestorPath) });
        }
      }
    }
    return treeFrom(byPath);
  }

  // Outermost re-walk roots for the changed paths: deduplicate by path, then drop any
  // boundary contained by another so overlapping edits re-walk their subtree once.
  private boundaries(
    rootSchema: Schema,
    data: unknown,
    changed: MetaObjectPath[],
  ): { path: MetaObjectPath; schema: Schema }[] {
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
  private boundaryFor(
    rootSchema: Schema,
    data: unknown,
    target: MetaObjectPath,
  ): { path: MetaObjectPath; schema: Schema } {
    const ctx = this.emitInto(new Map(), data);
    let schema = rootSchema;
    let value: unknown = data;
    let path: MetaObjectPath = [];
    let boundary: { path: MetaObjectPath; schema: Schema } = { path: [], schema: rootSchema };
    for (const key of target) {
      const { winners } = resolve(schema, value, ctx);
      const child = governingChild(winners, String(key), ctx.resolveRef);
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

export function analyzeMetaObjects(
  data: unknown,
  rootSchema: Schema,
  schemas: Record<string, Schema>,
  metaKey: string = META_KEY,
): MetaAnalysisResult {
  return new MetaAnalyzer(schemas, metaKey).analyze(data, rootSchema);
}
