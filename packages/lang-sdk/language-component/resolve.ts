import { type Schema, type Validator } from 'jsonschema';

import { type Identity, type SchemaTag, schemaTag } from './types.js';

/**
 * The decision core shared by the analyzer walk (`Scanner`) and interactive navigation
 * (`Cursor`): `resolve` is the single place a oneOf/anyOf/allOf is decided, returning the
 * identity and the concrete winner schema(s); `childSchema` then does pure structural
 * lookup on those winners to descend. Both consumers only ever follow winning branches
 * and decide identity identically.
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

function identityParts(parts: Resolution[]): Identity[] {
  return parts
    .map((part) => part.identity)
    .filter((identity): identity is Identity => identity != null);
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
// full-ref validation pass (document validity, errors, hits) plus validator
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

// Memoize the ref-cutoff: return a function that builds each schema's local shape
// (stripRefs) once and caches it by schema identity, so repeated resolves against the same
// schema reuse the copy instead of rebuilding it. The cache is stable across a scan.
export function createLocalShape(): (schema: Schema) => Schema {
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

// Exactly one branch must match. An untagged oneOf is transparent: the winner's identity
// passes through unchanged; a tagged one wraps the winner as its single part.
function resolveOneOf(s: Schema, branches: Resolution[], tag: SchemaTag | undefined): Resolution {
  const matched = branches.filter((part) => part.matched);
  if (matched.length === 1) {
    const [winner] = matched;
    const identity = tag ? composite('oneOf', tag, identityParts([winner])) : winner.identity;
    return { identity, matched: true, winners: [s, ...winner.winners] };
  }
  return {
    identity: unresolvedOrNull(
      `oneOf expected exactly one match, got ${matched.length}`,
      tag,
      identityParts(matched),
    ),
    matched: false,
    winners: [s],
  };
}

// At least one branch must match; every matched branch contributes its parts and winners.
function resolveAnyOf(s: Schema, branches: Resolution[], tag: SchemaTag | undefined): Resolution {
  const matched = branches.filter((part) => part.matched);
  if (matched.length) {
    return {
      identity: compositeOrNull('anyOf', tag, identityParts(matched)),
      matched: true,
      winners: [s, ...matched.flatMap((part) => part.winners)],
    };
  }
  return {
    identity: unresolvedOrNull('anyOf matched nothing', tag, []),
    matched: false,
    winners: [s],
  };
}

// Every branch must match. The parts found on the way are kept even on failure, so an
// unresolved identity still names what was considered.
function resolveAllOf(s: Schema, branches: Resolution[], tag: SchemaTag | undefined): Resolution {
  const found = identityParts(branches);
  if (branches.every((part) => part.matched)) {
    return {
      identity: compositeOrNull('allOf', tag, found),
      matched: true,
      winners: [s, ...branches.flatMap((part) => part.winners)],
    };
  }
  return {
    identity: unresolvedOrNull('allOf did not fully match', tag, found),
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
  const matched = validates(ctx.validator, value, ctx.localShape(s));
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
  // winner alongside any matched branch winners in every arm below. Mirrors the leaf path
  // (`winners: [s]`), which descends into own properties regardless of local validity.
  if (s.oneOf) {
    return resolveOneOf(s, s.oneOf.map(branch), tag);
  }
  if (s.anyOf) {
    return resolveAnyOf(s, s.anyOf.map(branch), tag);
  }
  if (s.allOf) {
    return resolveAllOf(s, s.allOf.map(branch), tag);
  }
  return resolveLeaf(s, tag, value, ctx);
}

/**
 * The schema owning the child at `key`, drawn from the winning schemas: an owned
 * property, an `additionalProperties` schema, or the governing `items` entry. Multiple
 * winners owning the same key compose into one `allOf`, and null means no winner owns
 * the key at all (the child is outside the schema's vocabulary).
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
