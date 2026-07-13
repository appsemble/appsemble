import { type Schema, type Validator } from 'jsonschema';

import { mapValues } from '../mapValues.js';
import { type Identity, type SchemaTag, schemaTag } from './types.js';

/**
 * The decision core shared by the analyzer walk (`Scanner`) and interactive navigation
 * (`Cursor`): `resolve` is the single place a oneOf/anyOf/allOf is decided, returning the
 * identity and the concrete winner schema(s); `resolveChild` then descends, taking the
 * value-directed resolver when one is configured and `childSchema`'s structural lookup
 * otherwise. Both consumers only ever follow winning branches and decide identity identically.
 */

export interface Resolution {
  identity: Identity | null;
  winners: Schema[];
  matched: boolean;
}

// Value-directed child resolver (BLOCKS.md, Approach B): given the parent's resolved
// identity, its value, and a child key, return the child's schema directly, bypassing the
// structural `childSchema` lookup. Used to resolve `type`+`version`-discriminated block
// params without materializing a union; returns null to fall back to structural descent.
export type DynamicChild = (
  parentIdentity: string | null,
  parentValue: unknown,
  key: string,
) => Schema | null;

// Per-analysis configuration shared by `Scanner` and `Cursor.at`.
export interface ResolveOptions {
  // A value-directed child resolver consulted before structural descent (see DynamicChild).
  dynamicChild?: DynamicChild;
}

// Everything `resolve` and `childSchema` need to decide identity and descend, minus
// the walk's emit sink. The cursor (interactive navigation) reuses this same context.
export interface ResolveContext {
  resolveRef: (ref: string) => Schema;
  validator: Validator;
  localShape: (schema: Schema) => Schema;
  dynamicChild?: DynamicChild;
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
function taggedOrNull(
  tag: SchemaTag | undefined,
  parts: Identity[],
  build: () => Identity,
): Identity | null {
  return tag || parts.length ? build() : null;
}

function compositeOrNull(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  tag: SchemaTag | undefined,
  parts: Identity[],
): Identity | null {
  return taggedOrNull(tag, parts, () => composite(mode, tag, parts));
}

function unresolvedOrNull(
  reason: string,
  tag: SchemaTag | undefined,
  parts: Identity[],
): Identity | null {
  return taggedOrNull(tag, parts, () => unresolved(reason, parts));
}

function identityParts(parts: Resolution[]): Identity[] {
  return parts
    .map((part) => part.identity)
    .filter((identity): identity is Identity => identity != null);
}

function deref(schema: Schema, resolveRef: (ref: string) => Schema): Schema {
  return schema.$ref ? deref(resolveRef(schema.$ref), resolveRef) : schema;
}

// Does `value` conform to `schema`'s own local shape? `localShape` applies the ref-cutoff
// first (see `stripRefs`), so this checks only the schema's own constraints and never
// recurses into referenced subtrees -- the walk visits those.
function matchesLocalShape(value: unknown, schema: Schema, ctx: ResolveContext): boolean {
  return ctx.validator.validate(value, ctx.localShape(schema), { base: '#', nestedErrors: true })
    .valid;
}

// Ref-cutoff: a copy of a schema with every nested $ref replaced by accept-all, so
// validating against it checks only the schema's own local shape and never recurses
// into referenced subtrees (the walk visits those). Nested `oneOf` is relaxed to
// `anyOf` because accept-all branches make exact-one vacuously false; exclusivity is
// not needed to recognize local shape.
//
// This is the dominant performance win: without it, resolve validates each node against
// its full schema and jsonschema follows $refs, so a subtree is re-validated inside every
// ancestor -- O(N x nesting-depth), seconds on a medium app. (A per-run memo of validation
// by (value, schema) was tried and made no measurable difference: the costly validations
// are all distinct, not repeated. The remaining cost is the single full-ref validation
// pass for document validity/errors/hits, plus validator construction.)
function stripRefs(schema: Schema): Schema {
  if (schema.$ref) {
    return {};
  }
  const copy: Schema = { ...schema };
  if (copy.properties) {
    copy.properties = mapValues(copy.properties, stripRefs);
  }
  if (copy.items && typeof copy.items === 'object') {
    copy.items = Array.isArray(copy.items) ? copy.items.map(stripRefs) : stripRefs(copy.items);
  }
  if (copy.additionalProperties && typeof copy.additionalProperties === 'object') {
    copy.additionalProperties = stripRefs(copy.additionalProperties);
  }
  // Recurse into every combinator...
  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    if (copy[keyword]) {
      copy[keyword] = copy[keyword].map(stripRefs);
    }
  }
  // ...then relax the stripped `oneOf` into `anyOf` (exact-one is vacuous under accept-all).
  if (copy.oneOf) {
    copy.anyOf = [...(copy.anyOf ?? []), ...copy.oneOf];
    delete copy.oneOf;
  }
  return copy;
}

// Memoize the ref-cutoff: return a function that builds each schema's local shape
// (stripRefs) once and caches it by schema identity, so repeated resolves against the same
// schema reuse the copy instead of rebuilding it. The cache is stable across a scan.
export function localShapeFactory(): (schema: Schema) => Schema {
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

// A oneOf/anyOf/allOf node. The three combinators share one skeleton -- thread the
// governing branches' winners, wrap their parts into an identity, and on failure still
// name what was considered -- and differ only in three axes:
//
//   oneOf: exactly one branch must match, and that lone winner governs descent. An
//          untagged oneOf is transparent -- it adds no identity of its own, so the
//          winner's identity passes straight through.
//   anyOf: at least one must match; every matched branch governs.
//   allOf: all must match; all branches govern, and their identities are kept even on
//          failure so an unresolved allOf still names its parts.
//
// Contrast `resolveLeaf`, which has no branches to weigh and validates a shape directly.
function resolveComposite(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  s: Schema,
  branches: Resolution[],
  tag: SchemaTag | undefined,
): Resolution {
  const matched = branches.filter((branch) => branch.matched);
  const satisfied =
    mode === 'oneOf'
      ? matched.length === 1
      : mode === 'allOf'
        ? matched.length === branches.length
        : matched.length > 0;

  if (satisfied) {
    // An allOf is governed by every branch; oneOf/anyOf only by the ones that matched.
    const governing = mode === 'allOf' ? branches : matched;
    const parts = identityParts(governing);
    const identity =
      mode === 'oneOf' && !tag ? governing[0].identity : compositeOrNull(mode, tag, parts);
    return { identity, matched: true, winners: [s, ...governing.flatMap((b) => b.winners)] };
  }

  const reason =
    mode === 'oneOf'
      ? `oneOf expected exactly one match, got ${matched.length}`
      : mode === 'allOf'
        ? 'allOf did not fully match'
        : 'anyOf matched nothing';
  // Failure still names what was considered: allOf every branch, oneOf the ones that
  // matched, anyOf nothing (none passed).
  const considered = mode === 'allOf' ? branches : mode === 'oneOf' ? matched : [];
  return {
    identity: unresolvedOrNull(reason, tag, identityParts(considered)),
    matched: false,
    winners: [s],
  };
}

// Leaf/object schema: its own properties govern children regardless of validity.
// Validate only the local shape (ref-cutoff); the walk visits referenced subtrees.
// A tagged object keeps its identity even when it fails its own constraints; the
// failure surfaces through localValid and the attached errors, never by erasing
// the object (mirroring how a oneOf winner keeps identity under an outer if/then).
function resolveLeaf(
  s: Schema,
  tag: SchemaTag | undefined,
  value: unknown,
  ctx: ResolveContext,
): Resolution {
  const matched = matchesLocalShape(value, s, ctx);
  return { identity: tag ? single(tag.name) : null, matched, winners: [s] };
}

export function resolve(
  schema: Schema,
  value: unknown,
  ctx: ResolveContext,
  seen: ReadonlySet<Schema> = new Set(),
): Resolution {
  const s = deref(schema, ctx.resolveRef);
  const tag = schemaTag(s);

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
  const branch = (b: Schema): Resolution => resolve(b, value, ctx, nested);

  // The enclosing schema always governs its own children: a schema may carry a combinator
  // *and* its own `properties`/`items` (e.g. `allOf: [Base]` plus own fields), so `s` is a
  // winner alongside any matched branch winners (see `resolveComposite`). Mirrors the leaf
  // path (`winners: [s]`), which descends into own properties regardless of local validity.
  for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
    const branches = s[mode];
    if (branches) {
      return resolveComposite(mode, s, branches.map(branch), tag);
    }
  }
  return resolveLeaf(s, tag, value, ctx);
}

// The schema a single winner contributes for `key`, or null when it does not own the key: a
// declared property, the open `additionalProperties` schema, or an `items` entry (single-schema
// `items` owns every element; tuple-form `items` owns by position).
function ownedChild(schema: Schema, key: string): Schema | null {
  if (schema.properties && Object.hasOwn(schema.properties, key)) {
    return schema.properties[key];
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    return schema.additionalProperties;
  }
  if (schema.items && typeof schema.items === 'object') {
    const item = Array.isArray(schema.items) ? schema.items[Number(key)] : schema.items;
    return item && typeof item === 'object' ? item : null;
  }
  return null;
}

/**
 * The schema governing the child at `key`, gathered across the parent's winning schemas: each
 * winner may own the key through a property, `additionalProperties`, or `items` (see `ownedChild`).
 * Winners that own it compose into one `allOf`; null means no winner owns the key, so the child is
 * outside the schema's vocabulary and does not mount.
 *
 * @param winners The winning schemas from `resolve` at the parent node.
 * @param key The child key (an object property or a stringified array index).
 * @param resolveRef The registry's ref resolver.
 * @returns The child's governing schema, or null when no winner owns the key.
 */
export function childSchema(
  winners: Schema[],
  key: string,
  resolveRef: (ref: string) => Schema,
): Schema | null {
  const owners = winners
    .map((winner) => ownedChild(deref(winner, resolveRef), key))
    .filter((schema): schema is Schema => schema != null);
  if (owners.length === 0) {
    return null;
  }
  return owners.length === 1 ? owners[0] : { allOf: owners };
}

/**
 * Resolve the child at `key` during descent: consult the value-directed resolver first (when one
 * is configured), otherwise fall back to `childSchema`'s structural lookup over the winners. This
 * is the single descent step the walk (`Scanner`) and interactive navigation (`Cursor`) share, so
 * both pick the same child schema.
 *
 * @param ctx The resolve context carrying the ref resolver and optional dynamic-child resolver.
 * @param parentIdentity The resolved identity name at the parent, or null when untagged.
 * @param parentValue The parent's value, passed to the dynamic-child resolver.
 * @param key The child key (an object property or a stringified array index).
 * @param winners The winning schemas from `resolve` at the parent node.
 * @returns The child's schema, or null when nothing owns the key.
 */
export function resolveChild(
  ctx: ResolveContext,
  parentIdentity: string | null,
  parentValue: unknown,
  key: string,
  winners: Schema[],
): Schema | null {
  return (
    ctx.dynamicChild?.(parentIdentity, parentValue, key) ??
    childSchema(winners, key, ctx.resolveRef)
  );
}
