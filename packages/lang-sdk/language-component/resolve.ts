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
  // The node's own ref-cut errors, including those of a combinator's sibling keywords.
  localErrors?: ValidationError[];
  // The union this node resolves through, so a consumer can list its branches and switch kind. A
  // union inside an `allOf` branch bubbles up to the node. Absent when no union is involved.
  union?: ResolvedUnion;
  // A discriminator selected this node's branch, so it keeps its identity while `matched` is false.
  selected?: boolean;
}

// One branch of a union: its schema as written (a `$ref` stays a `$ref`) and the component name it
// declares, read without a value. Null for an untagged branch. Which branch a value selects is
// `Resolution.identity`, not this.
export interface UnionBranch {
  schema: Schema;
  name: string | null;
}

// A union as declared: its mode, its discriminator (null when it has none), and every branch,
// independent of the current value.
export interface ResolvedUnion {
  mode: 'anyOf' | 'oneOf';
  discriminator: Discriminator | null;
  branches: UnionBranch[];
}

// Value-directed child resolver (BLOCKS.md): return a child schema directly from the parent's
// identity + value + key, bypassing `childSchema` — resolves type+version-discriminated block
// params without a union. Null falls back to structural descent.
export type DynamicChild = (
  parentIdentity: string | null,
  parentValue: unknown,
  key: string,
) => Schema | null;

// Loads whatever the sync `dynamicChild` reads (e.g. a block manifest). The async descent
// (`childAsync`/`scanAsync`) awaits it right before each step.
export type LoadDynamicChild = (
  parentIdentity: string | null,
  parentValue: unknown,
  key: string,
) => Promise<void>;

export interface ResolveOptions {
  dynamicChild?: DynamicChild;
  loadDynamicChild?: LoadDynamicChild;
  draftChildSchemas?: boolean;
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
  loadDynamicChild?: LoadDynamicChild;
  draftChildSchemas?: boolean;
  // Resolutions shared across cursors, keyed by value object then schema. An edit creates new value
  // objects only along the changed path, so unchanged subtrees keep their entries.
  resolutionCache?: WeakMap<object, Map<Schema, Resolution>>;
}

export function deref(schema: Schema, resolveRef: (ref: string) => Schema): Schema {
  return schema.$ref ? deref(resolveRef(schema.$ref), resolveRef) : schema;
}

// The component name a union branch declares: its own schema tag, read value-independently (not which
// branch a value selects). Null for an untagged/anonymous branch.
function branchName(branch: Schema, ctx: ResolveContext): string | null {
  return schemaTag(deref(branch, ctx.resolveRef))?.name ?? null;
}

function unresolved(reason: string, parts: Identity[] = []): Identity {
  return { kind: 'unresolved', name: 'UnresolvedLanguageComponent', parts, reason };
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

// The ref-cut, computed once per schema. Validating against the full schema would re-validate every
// referenced subtree inside each ancestor (O(N x depth)); see PERFORMANCE.md.
export function localShapeFactory(): (schema: Schema) => Schema {
  // A copy of `schema` with every nested $ref replaced by accept-all, so validating it checks only
  // the schema's own shape. Nested `oneOf` becomes `anyOf`: with accept-all branches, exactly-one
  // would always fail.
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
      const branch = copy[keyword];
      if (branch) {
        copy[keyword] = branch.map(stripRefs);
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

// A oneOf/anyOf/allOf node:
//   oneOf: exactly one branch matches and governs; an untagged oneOf passes the winner through.
//   anyOf: at least one matches; every matched branch governs.
//   allOf: all match; all branches govern.
// The node also matches its own keywords next to the combinator (`required`, `type`, ...), which no
// branch checks.
function resolveComposite(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  schema: Schema,
  branches: Resolution[],
  tag: SchemaTag | undefined,
  value: unknown,
  ctx: ResolveContext,
): Resolution {
  const own = matchesLocalShape(value, schema, ctx);
  const matched = branches.filter((branch) => branch.matched);
  // A union decided in a nested branch still surfaces here (a union merged into an allOf).
  const union = branches.map((branch) => branch.union).find(Boolean);

  let satisfied: boolean;
  let governing: Resolution[];
  // On failure, the branches to name as considered: all of them for allOf, the matched ones for oneOf.
  let considered: Resolution[];
  let reason: string;
  switch (mode) {
    case 'oneOf':
      satisfied = matched.length === 1;
      governing = matched;
      considered = matched;
      reason = `oneOf expected exactly one match, got ${matched.length}`;
      break;
    case 'anyOf':
      satisfied = matched.length > 0;
      governing = matched;
      considered = [];
      reason = 'anyOf matched nothing';
      break;
    case 'allOf':
      satisfied = branches.every((branch) => branch.matched || branch.selected);
      governing = branches;
      considered = branches;
      reason = 'allOf did not fully match';
      break;
  }

  const parts = (satisfied ? governing : considered).flatMap((branch) =>
    branch.identity ? [branch.identity] : [],
  );
  // An anonymous combinator over untagged branches is transparent: it has no identity of its own.
  const transparent = !tag && parts.length === 0;
  if (satisfied) {
    let identity: Identity | null = null;
    if (mode === 'oneOf' && !tag) {
      identity = governing[0].identity;
    } else if (!transparent) {
      identity = { kind: 'composite', mode, name: tag?.name ?? mode, parts };
    }
    return {
      identity,
      matched: own.matched && governing.every((branch) => branch.matched),
      winners: [schema, ...governing.flatMap((b) => b.winners)],
      localErrors: [...own.errors, ...governing.flatMap((b) => b.localErrors ?? [])],
      union,
      selected: governing.some((branch) => branch.selected),
    };
  }
  return {
    identity: transparent ? null : unresolved(reason, parts),
    matched: false,
    winners: [schema],
    localErrors: own.errors,
    union,
  };
}

// The branch a discriminator selected governs whether or not the value satisfies it yet: the tag has
// decided, so a half-written value keeps its identity and child schemas, and the failure shows in
// `matched` and `localErrors`. An untagged union has no name of its own and passes the branch through.
function resolveSelected(
  mode: 'anyOf' | 'oneOf',
  schema: Schema,
  branch: Resolution,
  tag: SchemaTag | undefined,
  value: unknown,
  ctx: ResolveContext,
): Resolution {
  const own = matchesLocalShape(value, schema, ctx);
  const parts = branch.identity ? [branch.identity] : [];
  return {
    identity: tag ? { kind: 'composite', mode, name: tag.name, parts } : branch.identity,
    matched: own.matched && branch.matched,
    winners: [schema, ...branch.winners],
    localErrors: [...own.errors, ...(branch.localErrors ?? [])],
    union: branch.union,
    selected: true,
  };
}

// A leaf or object node. A tagged one keeps its identity when it fails its constraints; the failure
// shows in `matched` and `localErrors`.
function resolveLeaf(
  schema: Schema,
  tag: SchemaTag | undefined,
  value: unknown,
  ctx: ResolveContext,
): Resolution {
  const { matched, errors } = matchesLocalShape(value, schema, ctx);
  return {
    identity: tag ? { kind: 'single', name: tag.name } : null,
    matched,
    winners: [schema],
    localErrors: errors,
  };
}

// A union's discriminator, from OpenAPI `discriminator` (one field) or `x-appsemble-discriminator`
// (one or more fields): the fields whose values select one branch, so only that branch is resolved.
export interface Discriminator {
  propertyNames: string[];
  mapping?: Record<string, string>;
  separator: string;
  required: boolean;
  // The tag to assume when the discriminant field is absent (a basic page has no `type`).
  default?: string;
}

export function readDiscriminator(schema: Schema): Discriminator | null {
  const x = (
    schema as {
      'x-appsemble-discriminator'?: {
        propertyNames?: string[];
        mapping?: Record<string, string>;
        separator?: string;
        required?: boolean;
        default?: string;
      };
    }
  )['x-appsemble-discriminator'];
  if (x?.propertyNames?.length) {
    return {
      propertyNames: x.propertyNames,
      mapping: x.mapping,
      separator: x.separator ?? '@',
      required: x.required ?? true,
      default: x.default,
    };
  }
  const std = (
    schema as { discriminator?: { propertyName?: string; mapping?: Record<string, string> } }
  ).discriminator;
  if (std?.propertyName) {
    return {
      propertyNames: [std.propertyName],
      mapping: std.mapping,
      separator: '@',
      required: true,
    };
  }
  return null;
}

// The routing tag a value carries (its discriminant field values joined), or null when any is absent.
function discriminantTag(disc: Discriminator, value: unknown): string | null {
  if (value == null || typeof value !== 'object') {
    return null;
  }
  const parts = disc.propertyNames.map((name) => (value as Record<string, unknown>)[name]);
  return parts.some((part) => part == null) ? null : parts.map(String).join(disc.separator);
}

// The tag a *branch schema* declares, by reading each discriminant field's `const`/single-`enum`.
// Used to match a value's tag to a branch when there is no explicit `mapping`.
function branchTag(disc: Discriminator, schema: Schema): string | null {
  const parts = disc.propertyNames.map((name) => {
    const prop = schema.properties?.[name] as Schema | undefined;
    if (prop?.const != null) {
      return prop.const;
    }
    return Array.isArray(prop?.enum) && prop.enum.length === 1 ? prop.enum[0] : undefined;
  });
  return parts.some((part) => part == null) ? null : parts.map(String).join(disc.separator);
}

// The single branch a tag selects: explicit `mapping` (tag -> $ref) first, else the branch whose own
// declared tag matches, else the branch whose `$ref` basename equals the tag (OpenAPI implicit
// mapping). Null when nothing matches — an unknown tag.
function pickBranch(
  disc: Discriminator,
  tag: string,
  branches: Schema[],
  ctx: ResolveContext,
): Schema | null {
  if (disc.mapping && Object.hasOwn(disc.mapping, tag)) {
    return deref({ $ref: disc.mapping[tag] }, ctx.resolveRef);
  }
  for (const branch of branches) {
    const target = deref(branch, ctx.resolveRef);
    if (branchTag(disc, target) === tag || branch.$ref?.split('/').at(-1) === tag) {
      return target;
    }
  }
  return null;
}

/**
 * Break a ref-cut tie. When more than one branch of an anyOf/oneOf matches locally, re-validate those
 * branches in full and keep the ones the value satisfies. If none does, the value is incomplete and
 * the ref-cut matches stay.
 *
 * @param mode The composite mode of the union (`allOf`/`anyOf`/`oneOf`).
 * @param branchSchemas The union's branch schemas, index-aligned with `resolutions`.
 * @param resolutions The ref-cut resolutions to disambiguate.
 * @param value The value being resolved against the union.
 * @param ctx The resolve context, carrying the validator.
 * @returns The disambiguated resolutions, or the input untouched when no escalation applies.
 */
function escalateAmbiguous(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  branchSchemas: readonly Schema[],
  resolutions: Resolution[],
  value: unknown,
  ctx: ResolveContext,
): Resolution[] {
  if (mode === 'allOf') {
    return resolutions;
  }
  const matchedIdx = resolutions.flatMap((resolution, index) =>
    resolution.matched ? [index] : [],
  );
  if (matchedIdx.length <= 1) {
    return resolutions;
  }
  const deepMatched = matchedIdx.filter(
    (index) => ctx.validator.validate(value, branchSchemas[index], { base: '#' }).valid,
  );
  if (deepMatched.length === 0) {
    return resolutions;
  }
  const keep = new Set(deepMatched);
  return resolutions.map((resolution, index) =>
    matchedIdx.includes(index) && !keep.has(index) ? { ...resolution, matched: false } : resolution,
  );
}

export function resolve(
  schema: Schema,
  value: unknown,
  ctx: ResolveContext,
  seen: ReadonlySet<Schema> = new Set(),
): Resolution {
  const resolved = deref(schema, ctx.resolveRef);
  const tag = schemaTag(resolved);

  // Cycle guard: a branch that $refs an enclosing combinator would expand forever. `seen` holds the
  // ancestor schemas being resolved.
  if (seen.has(resolved)) {
    return {
      identity: tag ? unresolved('cyclic schema reference') : null,
      matched: false,
      winners: [resolved],
    };
  }
  const nested = new Set(seen).add(resolved);
  const resolveBranch = (branch: Schema): Resolution => resolve(branch, value, ctx, nested);

  // A combinator node can also have its own `properties`/`items`, so `resolved` is always a winner.
  for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
    const branches = resolved[mode];
    if (branches) {
      const disc = mode === 'allOf' ? null : readDiscriminator(resolved);
      // This node's own union takes precedence over one bubbled up from a branch.
      const thisUnion: ResolvedUnion | undefined =
        mode !== 'allOf' && branches.length >= 2
          ? {
              mode,
              discriminator: disc,
              branches: branches.map((branch) => ({
                schema: branch,
                name: branchName(branch, ctx),
              })),
            }
          : undefined;
      // A discriminated union resolves only the branch its tag selects; a missing (with `required`)
      // or unknown tag is a failure at this node.
      if (disc) {
        // An absent tag falls back to the declared `default` (a basic page has no `type`).
        const tagValue = discriminantTag(disc, value) ?? disc.default ?? null;
        const fields = disc.propertyNames.join('+');
        const picked = tagValue == null ? null : pickBranch(disc, tagValue, branches, ctx);
        if (picked) {
          const selected = resolveSelected(
            mode as 'anyOf' | 'oneOf',
            resolved,
            resolveBranch(picked),
            tag,
            value,
            ctx,
          );
          return thisUnion ? { ...selected, union: thisUnion } : selected;
        }
        if (tagValue != null || disc.required) {
          const reason =
            tagValue == null ? `missing discriminator ${fields}` : `unknown ${fields}: ${tagValue}`;
          return {
            identity: tag ? unresolved(reason) : null,
            matched: false,
            winners: [resolved],
            union: thisUnion,
          };
        }
      }
      const composed = resolveComposite(
        mode,
        resolved,
        escalateAmbiguous(mode, branches, branches.map(resolveBranch), value, ctx),
        tag,
        value,
        ctx,
      );
      return thisUnion ? { ...composed, union: thisUnion } : composed;
    }
  }
  return resolveLeaf(resolved, tag, value, ctx);
}

// The schema a winner contributes for `key` (a declared property, open `additionalProperties`, or
// an `items` entry — single `items` owns every element, tuple `items` by position), or null.
function ownedChild(
  schema: Schema,
  key: string,
  resolveRef: (ref: string) => Schema,
  draftChildSchemas = false,
  seen = new Set<Schema>(),
): Schema | null {
  if (seen.has(schema)) {
    return null;
  }
  seen.add(schema);
  if (schema.properties && Object.hasOwn(schema.properties, key)) {
    return schema.properties[key];
  }
  if (schema.additionalProperties === true) {
    return {};
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    return schema.additionalProperties;
  }
  if (schema.items && typeof schema.items === 'object') {
    const item = Array.isArray(schema.items) ? schema.items[Number(key)] : schema.items;
    return item && typeof item === 'object' ? item : null;
  }
  const branches = schema.allOf ?? (draftChildSchemas ? (schema.anyOf ?? schema.oneOf) : undefined);
  if (Array.isArray(branches)) {
    const owners = branches
      .map((branch) =>
        ownedChild(
          deref(branch as Schema, resolveRef),
          key,
          resolveRef,
          draftChildSchemas,
          new Set(seen),
        ),
      )
      .filter((child): child is Schema => child != null);
    if (owners.length) {
      return owners.length === 1 ? owners[0] : { allOf: owners };
    }
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
  draftChildSchemas = false,
): Schema | null {
  const owners = winners
    .map((winner) => ownedChild(deref(winner, resolveRef), key, resolveRef, draftChildSchemas))
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
    childSchema(resolution.winners, key, ctx.resolveRef, ctx.draftChildSchemas)
  );
}

// One descent frame. The walk steps over these instead of allocating a `Node` per document node.
export interface StepChild {
  schema: Schema;
  value: unknown;
  path: NodePath;
}

// The descent step shared by the walk, `Node`, and `boundaryAt`: the child schema at `key` with the
// child's value and path, or null when no winner owns the key.
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
    const owned = ownedChild(deref(winner, resolveRef), key, resolveRef);
    if (owned) {
      return owned;
    }
  }
  return null;
}

// The value projected onto its ref-cut shape, the runtime mirror of `stripRefs`: inline fields are
// kept, slots that mount a separate component (`$ref` or `dynamicChild`) become `undefined`, and
// unknown keys pass through. It follows the same winners as `childNode`, so losing-branch fields
// never appear.
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
