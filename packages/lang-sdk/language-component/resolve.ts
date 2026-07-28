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
  // The discriminated (or plain) union this node resolves through, surfaced so a consumer (the GUI
  // editor's kind switcher) can enumerate every branch and switch kind — even when `comp` merged the
  // union into a nested `allOf` (the `draftChildSchemas` case), which structural inspection can't see.
  // Carried up from wherever the union was decided: the discriminator fast-path, a plain oneOf/anyOf,
  // or the nearest enclosing branch that had one. Absent for a node that resolves through no union.
  union?: ResolvedUnion;
}

// One branch of a union: its schema verbatim (a `$ref` stays a `$ref` so the consumer derefs lazily)
// paired with the component name it declares — the branch's own schema tag, read with no value. This is
// deliberately NOT an `Identity`: that is the value-directed resolution OUTCOME (which branch a node
// collapsed to, and how), and it lives on `Resolution.identity`. A branch has only a declared name, so a
// consumer can label the option and hand `name` straight to the typed cursor's `as(name)` without
// `$ref`-basename string-matching. Null for an untagged/anonymous branch (e.g. an undeclared basic page).
export interface UnionBranch {
  schema: Schema;
  name: string | null;
}

// A union a node resolves through, as declared: its combinator mode, the declared discriminator (null
// for a plain/undeclared union), and its branches (schema + resolved identity each). This is the
// schema-level shape of the union, independent of which branch the current value happens to select — the
// value-directed choice lives on `Resolution.identity`; this is the whole option space at the slot.
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

// The async load half of a value-directed child: fetch whatever the sync `dynamicChild` will then read
// (e.g. a block manifest), so it can answer synchronously afterwards. Awaited inline by the async
// descent (`childAsync`/`scanAsync`) right before the sync step — never a prime-everything-first pass.
// Resolving stays sync (`dynamicChild`); only loading is async, and only this hook is.
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
  // Compile-time verdict: can ref-cut local matching always pick this union's branch correctly?
  // A union it reports false for escalates to full validation when ref-cut matches more than one
  // branch (see `escalateAmbiguous`). Absent ⇒ every union is trusted (no escalation).
  refCutSufficient?: (schema: Schema) => boolean;
  // Optional resolution memo shared across cursors, keyed by value-object identity → schema. `Node`
  // consults it so a fresh cursor over an unchanged value (a re-render, or an edit elsewhere that
  // structurally shares this subtree) reuses the prior `Resolution` instead of re-resolving. Keyed by
  // value identity, so it self-invalidates: an edit mints new value objects for the changed path only.
  resolutionCache?: WeakMap<object, Map<Schema, Resolution>>;
}

export function deref(schema: Schema, resolveRef: (ref: string) => Schema): Schema {
  return schema.$ref ? deref(resolveRef(schema.$ref), resolveRef) : schema;
}

function single(name: string): Identity {
  return { kind: 'single', name };
}

// The component name a union branch declares: its own schema tag, read value-independently (not which
// branch a value selects). Null for an untagged/anonymous branch.
function branchName(branch: Schema, ctx: ResolveContext): string | null {
  return schemaTag(deref(branch, ctx.resolveRef))?.name ?? null;
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
  // Bubble a union decided deeper up to this node, so a union merged into a nested `allOf` still
  // surfaces on the enclosing node's resolution (the `draftChildSchemas` case).
  const union = branches.map((branch) => branch.union).find(Boolean);

  if (satisfied) {
    const governing = mode === 'allOf' ? branches : matched;
    const parts = identityParts(governing);
    const identity =
      mode === 'oneOf' && !tag ? governing[0].identity : compositeOrNull(mode, tag, parts);
    return {
      identity,
      matched: true,
      winners: [schema, ...governing.flatMap((b) => b.winners)],
      union,
    };
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
    union,
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

// A normalized discriminator read off a union schema. Standard OpenAPI `discriminator` (one field)
// and the Appsemble composite extension `x-appsemble-discriminator` (one or more fields) both reduce
// to this: the field(s) whose values form a routing tag, so a discriminated union resolves by reading
// the tag and validating ONE branch instead of walking every branch (O(branches) -> O(1)). See
// `resolve()` below. Only the fast-path lives here; unknown/missing tags fall back to explicit
// diagnostics or, for `required: false`, the ordinary walk.
export interface Discriminator {
  propertyNames: string[];
  mapping?: Record<string, string>;
  separator: string;
  required: boolean;
  // The tag to assume when the discriminant field is absent, so an untagged branch still resolves in
  // O(1) instead of falling back to the walk — e.g. a basic page (no `type`) via `default: 'basic'`
  // mapped to its branch. Absent ⇒ no default (honour `required` / draft-tolerant walk).
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
 * Break a ref-cut tie. When a union the compile-time analysis flagged as not ref-cut-separable has
 * more than one branch match locally (over-broad anyOf / ambiguous oneOf), re-validate just those
 * branches with full, ref-following validation and keep only the ones the value actually satisfies —
 * so the flagged node resolves as precisely as a whole-document validator would. Everything else (a
 * sufficient union, an unflagged union, allOf, a single match) is returned untouched, so the fast path
 * is unchanged and only genuine collisions pay. If nothing fully validates the value is incomplete, so
 * the lenient ref-cut set is kept rather than degrade a mid-edit value.
 *
 * @param mode The composite mode of the union (`allOf`/`anyOf`/`oneOf`).
 * @param union The union schema being resolved.
 * @param branchSchemas The union's branch schemas, index-aligned with `resolutions`.
 * @param resolutions The ref-cut resolutions to disambiguate.
 * @param value The value being resolved against the union.
 * @param ctx The resolve context, carrying the validator and ref-cut oracle.
 * @returns The disambiguated resolutions, or the input untouched when no escalation applies.
 */
function escalateAmbiguous(
  mode: 'allOf' | 'anyOf' | 'oneOf',
  union: Schema,
  branchSchemas: readonly Schema[],
  resolutions: Resolution[],
  value: unknown,
  ctx: ResolveContext,
): Resolution[] {
  if (mode === 'allOf' || (ctx.refCutSufficient ? ctx.refCutSufficient(union) : true)) {
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
      // Discriminator fast-path: for a tagged oneOf/anyOf, read the tag and resolve the ONE selected
      // branch instead of every branch. Same result shape as the walk (via `resolveComposite` on a
      // single branch), but O(1) and with precise diagnostics for a missing/unknown tag.
      const disc = mode === 'allOf' ? null : readDiscriminator(resolved);
      // The union this node itself is, surfaced on the resolution so a consumer can enumerate branches
      // and switch kind. Overrides any deeper union bubbled up from a branch — this direct one governs.
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
      if (disc) {
        // An absent tag falls back to the declared `default` (e.g. a basic page ⇒ 'basic'), keeping the
        // untagged branch O(1); with no default it's absent as before.
        const tagValue = discriminantTag(disc, value) ?? disc.default ?? null;
        if (tagValue == null) {
          // A discriminant field is absent (and no default). Tolerate it for drafts (`required: false`)
          // by falling back to the ordinary walk; otherwise it's an explicit, locatable failure.
          if (!disc.required) {
            return {
              ...resolveComposite(
                mode,
                resolved,
                escalateAmbiguous(
                  mode,
                  resolved,
                  branches,
                  branches.map(resolveBranch),
                  value,
                  ctx,
                ),
                tag,
              ),
              union: thisUnion,
            };
          }
          return {
            identity: unresolvedOrNull(
              `missing discriminator ${disc.propertyNames.join('+')}`,
              tag,
              [],
            ),
            matched: false,
            winners: [resolved],
            union: thisUnion,
          };
        }
        const picked = pickBranch(disc, tagValue, branches, ctx);
        if (!picked) {
          return {
            identity: unresolvedOrNull(
              `unknown ${disc.propertyNames.join('+')}: ${tagValue}`,
              tag,
              [],
            ),
            matched: false,
            winners: [resolved],
            union: thisUnion,
          };
        }
        return {
          ...resolveComposite(mode, resolved, [resolveBranch(picked)], tag),
          union: thisUnion,
        };
      }
      const composed = resolveComposite(
        mode,
        resolved,
        escalateAmbiguous(mode, resolved, branches, branches.map(resolveBranch), value, ctx),
        tag,
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
    const owned = ownedChild(deref(winner, resolveRef), key, resolveRef);
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
