import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import { mapValues } from '../mapValues.js';
import { type Identity, type NodePath, type SchemaTag, schemaTag } from './types.js';

/**
 * The decision core. `resolve` decides a oneOf/anyOf/allOf and returns the identity plus the winner
 * schema(s); `resolveAtKey`/`childNode` descend (the value-directed resolver first, else
 * `childSchema`'s structural lookup). The walk and `Node` share these, so both decide identity
 * identically and only ever follow winning branches.
 */

export interface Resolution {
  identity: Identity | null;
  winners: Schema[];
  matched: boolean;
  // A leaf's own ref-cut errors; a combinator has none (its validity is whether branches matched).
  localErrors?: ValidationError[];
}

// Value-directed child resolver (BLOCKS.md): return a child schema directly from the parent's
// identity + value + key, bypassing `childSchema` — resolves type+version-discriminated block
// params without a union. Null falls back to structural descent.
export type DynamicChild = (
  parentIdentity: string | null,
  parentValue: unknown,
  key: string,
) => Schema | null;

export interface ResolveOptions {
  dynamicChild?: DynamicChild;
  // Override the registry's default jsonschema validator — e.g. an editor registering per-block
  // schemas under their own URLs so a large union validates without walking every branch.
  validatorFactory?: () => Validator;
}

// The descent core's inputs (ref resolver, validator, ref-cut, dynamic-child hook), minus the
// walk's emit sink; `Node` reuses the same context.
export interface ResolveContext {
  resolveRef: (ref: string) => Schema;
  validator: Validator;
  localShape: (schema: Schema) => Schema;
  dynamicChild?: DynamicChild;
}

function single(name: string): Identity {
  return { kind: 'single', name };
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

// A combinator yields an identity only if tagged or it resolved tagged parts; an anonymous
// combinator over untagged branches is transparent.
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

// Does `value` match `schema`'s own (ref-cut) local shape? Never recurses into $ref'd subtrees —
// the walk visits those.
function matchesLocalShape(
  value: unknown,
  schema: Schema,
  ctx: ResolveContext,
): { matched: boolean; errors: ValidationError[] } {
  const result = ctx.validator.validate(value, ctx.localShape(schema), {
    base: '#',
    nestedErrors: true,
  });
  return { matched: result.valid, errors: result.errors };
}

// Memoize the ref-cutoff: `stripRefs` each schema once, cached by schema identity, reused across a
// scan. This is the dominant perf win — without it, resolve validates each node against its full
// schema and jsonschema follows $refs, re-validating a subtree inside every ancestor (O(N x depth),
// seconds on a medium app). (A per-(value, schema) memo was tried and didn't help: the costly
// validations are all distinct.)
export function localShapeFactory(): (schema: Schema) => Schema {
  // A copy of `schema` with every nested $ref replaced by accept-all, so validating against it
  // checks only the schema's own shape (the walk visits referenced subtrees). Nested `oneOf` is
  // relaxed to `anyOf` — accept-all branches make exact-one vacuous, and exclusivity isn't needed
  // to recognize local shape.
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
    for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
      if (copy[keyword]) {
        copy[keyword] = copy[keyword].map(stripRefs);
      }
    }
    if (copy.oneOf) {
      copy.anyOf = [...(copy.anyOf ?? []), ...copy.oneOf];
      delete copy.oneOf;
    }
    return copy;
  }

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

// A oneOf/anyOf/allOf node. One skeleton over three rules:
//   oneOf: exactly one branch matches and governs; an untagged oneOf is transparent (the winner's
//          identity passes through).
//   anyOf: at least one matches; every matched branch governs.
//   allOf: all match; all branches govern, and their identities are kept even on failure.
function resolveComposite(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  schema: Schema,
  branches: Resolution[],
  tag: SchemaTag | undefined,
): Resolution {
  const matched = branches.filter((branch) => branch.matched);
  const satisfied = {
    oneOf: matched.length === 1,
    allOf: matched.length === branches.length,
    anyOf: matched.length > 0,
  }[mode];

  if (satisfied) {
    const governing = mode === 'allOf' ? branches : matched;
    const parts = identityParts(governing);
    const identity =
      mode === 'oneOf' && !tag ? governing[0].identity : compositeOrNull(mode, tag, parts);
    return { identity, matched: true, winners: [schema, ...governing.flatMap((b) => b.winners)] };
  }

  const reason = {
    oneOf: `oneOf expected exactly one match, got ${matched.length}`,
    allOf: 'allOf did not fully match',
    anyOf: 'anyOf matched nothing',
  }[mode];
  // Failure still names what was considered: allOf every branch, oneOf the ones that matched.
  const considered = { allOf: branches, oneOf: matched, anyOf: [] as Resolution[] }[mode];
  return {
    identity: unresolvedOrNull(reason, tag, identityParts(considered)),
    matched: false,
    winners: [schema],
  };
}

// Leaf/object: own properties govern children regardless of validity. A tagged object keeps its
// identity even when it fails its constraints — the failure surfaces via localValid + errors, not
// by erasing the object.
function resolveLeaf(
  schema: Schema,
  tag: SchemaTag | undefined,
  value: unknown,
  ctx: ResolveContext,
): Resolution {
  const { matched, errors } = matchesLocalShape(value, schema, ctx);
  return {
    identity: tag ? single(tag.name) : null,
    matched,
    winners: [schema],
    localErrors: errors,
  };
}

export function resolve(
  schema: Schema,
  value: unknown,
  ctx: ResolveContext,
  seen: ReadonlySet<Schema> = new Set(),
): Resolution {
  const resolved = deref(schema, ctx.resolveRef);
  const tag = schemaTag(resolved);

  // Cycle guard: a combinator branch that $refs an enclosing combinator expands forever (resolve
  // expands combinators structurally, unbounded by the value). `seen` = ancestor schemas being
  // resolved; re-entering one stops, with the enclosing schema still governing (`winners: [resolved]`).
  if (seen.has(resolved)) {
    return {
      identity: tag ? unresolved('cyclic schema reference') : null,
      matched: false,
      winners: [resolved],
    };
  }
  const nested = new Set(seen).add(resolved);
  const resolveBranch = (branch: Schema): Resolution => resolve(branch, value, ctx, nested);

  // The enclosing schema always governs its own children: it may carry a combinator AND its own
  // `properties`/`items`, so `resolved` is a winner alongside any matched-branch winners.
  for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
    const branches = resolved[mode];
    if (branches) {
      return resolveComposite(mode, resolved, branches.map(resolveBranch), tag);
    }
  }
  return resolveLeaf(resolved, tag, value, ctx);
}

// The schema a winner contributes for `key` (a declared property, open `additionalProperties`, or
// an `items` entry — single `items` owns every element, tuple `items` by position), or null.
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

// The schema governing the child at `key`, gathered across the parent's winning schemas: each winner
// may own the key via a property, `additionalProperties`, or `items`. Owners compose into one
// `allOf`; null means no winner owns the key, so the child is outside the vocabulary and won't mount.
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

// The schema half of the descent step: the value-directed resolver first (when configured), else
// `childSchema`'s structural lookup over the winners. `childNode` wraps this with the value/path
// arithmetic, so the walk, `Node`, and `boundaryAt` all step identically.
export function resolveAtKey(
  resolution: Resolution,
  parentValue: unknown,
  key: string,
  ctx: ResolveContext,
): Schema | null {
  return (
    ctx.dynamicChild?.(resolution.identity?.name ?? null, parentValue, key) ??
    childSchema(resolution.winners, key, ctx.resolveRef)
  );
}

// One descent frame: schema + value + path. The walk steps over these transient frames — never a
// `Node` per document node (perf guardrail, PERFORMANCE.md); `Node`/`boundaryAt` reuse the same step.
export interface StepChild {
  schema: Schema;
  value: unknown;
  path: NodePath;
}

// The single descent step shared by the walk, `Node`, and `boundaryAt`: resolve the child schema at
// `key` (value-directed then structural) and pair it with the child's value and path; null when no
// winner owns the key. A free function over plain frames, so the walk allocates no `Node` per node.
export function childNode(
  parentValue: unknown,
  parentPath: NodePath,
  resolution: Resolution,
  key: number | string,
  ctx: ResolveContext,
): StepChild | null {
  const schema = resolveAtKey(resolution, parentValue, String(key), ctx);
  if (!schema) {
    return null;
  }
  const value =
    parentValue == null ? undefined : (parentValue as Record<number | string, unknown>)[key];
  return { schema, value, path: [...parentPath, key] };
}

// The raw (pre-deref) schema the winners give `key`: the first winner that owns it. Unlike
// `childSchema` this does NOT deref, so a `$ref` child stays a `$ref` — the marker that the child is
// a separately-mounted component rather than an inline field.
function rawOwnedChild(
  winners: Schema[],
  key: string,
  resolveRef: (ref: string) => Schema,
): Schema | null {
  for (const winner of winners) {
    const owned = ownedChild(deref(winner, resolveRef), key);
    if (owned) {
      return owned;
    }
  }
  return null;
}

// The value projected onto its local (ref-cut) shape: the runtime mirror of `stripRefs`. Own inline
// fields are kept (recursively projected); slots that mount a SEPARATE component — a `$ref` child or
// a value-directed (`dynamicChild`) child — are blanked to `undefined`; keys outside the vocabulary
// pass through unchanged; containers (arrays, maps) keep their length/keys. Projects over the same
// resolved winners `childNode` descends, so it follows combinator resolution (oneOf winner, anyOf
// matched, allOf all) and never surfaces losing-branch fields. Cheap: one `resolve` per level, no
// deref of the cut subtrees. For a GUI editor rendering just this component's own editable fields.
export function localValue(schema: Schema, value: unknown, ctx: ResolveContext): unknown {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  const { winners, identity } = resolve(schema, value, ctx);
  const projectKey = (key: number | string): unknown => {
    const own = (value as Record<number | string, unknown>)[key];
    if (ctx.dynamicChild?.(identity?.name ?? null, value, String(key))) {
      return undefined;
    }
    const raw = rawOwnedChild(winners, String(key), ctx.resolveRef);
    if (!raw) {
      return own;
    }
    return raw.$ref ? undefined : localValue(raw, own, ctx);
  };
  if (Array.isArray(value)) {
    return value.map((element, index) => projectKey(index));
  }
  return Object.fromEntries(Object.keys(value).map((key) => [key, projectKey(key)]));
}
