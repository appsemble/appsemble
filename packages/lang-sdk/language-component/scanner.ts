import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import { formatPath, getPath } from './path.js';
import { SchemaRegistry } from './schemaRegistry.js';
import {
  COMPONENT_KEY,
  type ScanHit,
  type Identity,
  type Mount,
  type NodePath,
  type SchemaTag,
  schemaTag,
} from './types.js';

/**
 * Language component analyzer: one structural walk builds the whole tree. `resolve` is the
 * single place a oneOf/anyOf/allOf is decided, returning the identity and the
 * concrete winner schema(s); `governingChild` then does pure structural lookup on
 * those winners to descend, so the walk only ever follows winning branches.
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

export interface Resolution {
  identity: Identity | null;
  winners: Schema[];
  matched: boolean;
}

// Everything `resolve` and `governingChild` need to decide identity and descend, minus
// the walk's emit sink. The cursor (interactive navigation) reuses this same context.
export interface ResolveContext {
  resolveRef: (ref: string) => Schema;
  validator: Validator;
  shallow: (schema: Schema) => Schema;
  componentKey: string;
}

interface WalkContext extends ResolveContext {
  emit: (path: NodePath, identity: Identity, localValid: boolean) => void;
}

export interface ScanResult {
  documentValid: boolean;
  hits: ScanHit[];
  interpretations: Map<string, Mount>;
}

// The identity tree alone: interpretations carry `localValid` but no document errors
// (those come from `validate`). Keyed by JSON Pointer; the identity is `.identity`. This
// is what `buildTree` produces and reuses.
export interface MountTree {
  interpretations: Map<string, Mount>;
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

function single(name: string): Identity {
  return { kind: 'single', name, parts: [] };
}

function unresolved(reason: string, parts: Identity[] = []): Identity {
  return { kind: 'unresolved', name: 'UnresolvedLanguageComponent', parts, reason };
}

function composite(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  tag: SchemaTag | undefined,
  parts: Identity[],
): Identity {
  return { kind: 'composite', mode, name: tag?.name ?? mode, parts };
}

// A combinator yields an identity only when it is itself tagged or resolved some tagged parts;
// an anonymous combinator over untagged branches is transparent and contributes nothing.
function compositeOrNull(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  tag: SchemaTag | undefined,
  parts: Identity[],
): Identity | null {
  return tag || parts.length ? composite(mode, tag, parts) : null;
}

function unresolvedOrNull(
  reason: string,
  tag: SchemaTag | undefined,
  parts: Identity[],
): Identity | null {
  return tag || parts.length ? unresolved(reason, parts) : null;
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

// Memoize the ref-cutoff: return a function that builds each schema's local-shape copy
// (stripRefs) once and caches it by schema identity, so repeated resolves against the same
// schema reuse the copy instead of rebuilding it. The cache is stable across a scan.
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

function identityParts(parts: Resolution[]): Identity[] {
  return parts
    .map((part) => part.identity)
    .filter((identity): identity is Identity => identity != null);
}

function pathContains(parent: NodePath, child: NodePath): boolean {
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
    } else if (schema.items && typeof schema.items === 'object') {
      // Single-schema `items` governs every element; tuple-form `items` governs by position.
      const item = Array.isArray(schema.items) ? schema.items[Number(key)] : schema.items;
      if (item && typeof item === 'object') {
        owned.push(item);
      }
    }
  }
  if (owned.length === 0) {
    return null;
  }
  return owned.length === 1 ? owned[0] : { allOf: owned };
}

export function resolve(
  schema: Schema,
  value: unknown,
  ctx: ResolveContext,
  seen: ReadonlySet<Schema> = new Set(),
): Resolution {
  const s = deref(schema, ctx.resolveRef);
  const tag = schemaTag(s, ctx.componentKey);

  // Cycle guard: a combinator branch that $refs an enclosing combinator expands `s` forever,
  // unbounded by the value (the walk is bounded by data; resolve expands combinators
  // structurally). `seen` is the ancestor path of schemas currently being resolved; re-entering
  // one is a cycle, so stop with the enclosing schema still governing descent (`winners: [s]`).
  if (seen.has(s)) {
    return {
      identity: tag ? unresolved('cyclic schema reference') : null,
      matched: false,
      winners: [s],
    };
  }
  const nested = new Set(seen).add(s);

  // The enclosing schema always governs its own children: a schema may carry a combinator
  // *and* its own `properties`/`items` (e.g. `allOf: [Base]` plus own fields), so `s` is a
  // winner alongside any matched branch winners. Mirrors the leaf path (`winners: [s]`),
  // which descends into own properties regardless of local validity.
  if (s.oneOf) {
    const parts = s.oneOf.map((branch) => resolve(branch, value, ctx, nested));
    const matched = parts.filter((part) => part.matched);
    if (matched.length === 1) {
      const [winner] = matched;
      const identity = tag ? composite('oneOf', tag, identityParts([winner])) : winner.identity;
      return { identity, matched: true, winners: [s, ...winner.winners] };
    }
    const found = identityParts(matched);
    const identity = unresolvedOrNull(
      `oneOf expected exactly one match, got ${matched.length}`,
      tag,
      found,
    );
    return { identity, matched: false, winners: [s] };
  }

  if (s.anyOf) {
    const parts = s.anyOf.map((branch) => resolve(branch, value, ctx, nested));
    const matched = parts.filter((part) => part.matched);
    if (matched.length) {
      const identity = compositeOrNull('anyOf', tag, identityParts(matched));
      return { identity, matched: true, winners: [s, ...matched.flatMap((part) => part.winners)] };
    }
    return {
      identity: unresolvedOrNull('anyOf matched nothing', tag, []),
      matched: false,
      winners: [s],
    };
  }

  if (s.allOf) {
    const parts = s.allOf.map((branch) => resolve(branch, value, ctx, nested));
    const found = identityParts(parts);
    if (parts.every((part) => part.matched)) {
      const identity = compositeOrNull('allOf', tag, found);
      return { identity, matched: true, winners: [s, ...parts.flatMap((part) => part.winners)] };
    }
    const identity = unresolvedOrNull('allOf did not fully match', tag, found);
    return { identity, matched: false, winners: [s] };
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

function walk(schema: Schema, value: unknown, path: NodePath, ctx: WalkContext): void {
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
  componentKey: string,
): { hits: ScanHit[]; documentValid: boolean; errors: ValidationError[] } {
  const hits: ScanHit[] = [];
  // eslint-disable-next-line no-param-reassign
  validator.attributes[componentKey] = (instance, currentSchema, options, context) => {
    const tag = schemaTag(currentSchema, componentKey);
    if (instance !== undefined && tag) {
      hits.push({ path: context.path, schema: currentSchema, tag });
    }
    return undefined as never;
  };
  const result = validator.validate(data, rootSchema, { base: '#', nestedErrors: true });
  return { documentValid: result.valid, errors: result.errors, hits };
}

function treeFrom(byPath: Map<string, Mount>): MountTree {
  return { interpretations: byPath };
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
  private readonly shallow: (schema: Schema) => Schema;

  // The schema keyword identities are read from (defaults to COMPONENT_KEY).
  private readonly componentKey: string;

  constructor(schemas: Record<string, Schema>, componentKey: string = COMPONENT_KEY) {
    this.registry = new SchemaRegistry(schemas);
    this.resolveValidator = this.registry.createValidator();
    this.shallow = createShallow();
    this.componentKey = componentKey;
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
  buildTree(data: unknown, rootSchema: Schema, options?: IncrementalOptions): MountTree {
    if (options?.previous && options.changed?.length) {
      return this.incremental(data, rootSchema, options.previous, options.changed);
    }
    const byPath = new Map<string, Mount>();
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
  validate(data: unknown, rootSchema: Schema): ScanValidation {
    const { documentValid, errors, hits } = collectHits(
      this.registry.createValidator(),
      data,
      rootSchema,
      this.componentKey,
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
  scan(data: unknown, rootSchema: Schema, options?: IncrementalOptions): ScanResult {
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

  private emitInto(byPath: Map<string, Mount>, data: unknown): WalkContext {
    return {
      emit(path, identity, localValid) {
        byPath.set(formatPath(path), {
          errors: [],
          localValid,
          identity,
          path,
          value: getPath(data, path),
        });
      },
      resolveRef: (ref) => this.registry.resolveRef(ref),
      shallow: this.shallow,
      componentKey: this.componentKey,
      validator: this.resolveValidator,
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
    changed: NodePath[],
  ): { path: NodePath; schema: Schema }[] {
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
    target: NodePath,
  ): { path: NodePath; schema: Schema } {
    const ctx = this.emitInto(new Map(), data);
    let schema = rootSchema;
    let value: unknown = data;
    let path: NodePath = [];
    let boundary: { path: NodePath; schema: Schema } = { path: [], schema: rootSchema };
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

export function scanComponents(
  data: unknown,
  rootSchema: Schema,
  schemas: Record<string, Schema>,
  componentKey: string = COMPONENT_KEY,
): ScanResult {
  return new Scanner(schemas, componentKey).scan(data, rootSchema);
}
