import { type Schema } from 'jsonschema';

import { deref, type Discriminator, readDiscriminator } from './resolve.js';
import { schemaTag } from './types.js';

/*
 * Compile-time distinguishability analysis. For every oneOf/anyOf union reachable from the root, it
 * decides — from the schema alone, no data — whether ref-cut local matching can always pick the right
 * branch(es). The verdict gates the runtime escalation in `resolve` (a `refCutSufficient` union never
 * escalates), and the recorded collisions double as an authoring lint.
 *
 * It is a SOUND over-approximation: a union is called sufficient only when every branch pair is
 * provably separable by local (ref-cut) shape or a declared discriminator. When separability can't be
 * proven the union is flagged, so the resolver escalates for it — safe (never a missed collision),
 * at worst a needless deep re-validation for a genuinely-overlapping anyOf.
 */

/*
 * A union whose branches aren't provably distinguishable by local shape. Severity is set by the
 * component labels — the thing a raw JSON Schema validator has no access to, and the reason this
 * prevalidation is meaningful at all:
 *   'error'   two branches are DISTINCT labeled components (different tag names). The dialect declares
 *             them as separate kinds, but ref-cut can't tell them apart, so identification is ambiguous
 *             — a labeling-vs-shape contradiction the author should resolve (add a discriminant).
 *   'warning' the union is a labeled component whose (unlabeled) branch forms overlap — the component
 *             is identified right, but its fields/winners over-broaden. An affordance imprecision.
 *   'info'    a purely structural overlap, no component label in play (e.g. a JSON-type alternative).
 */
export type CollisionSeverity = 'error' | 'info' | 'warning';

export interface UnionCollision {
  schema: Schema;
  mode: 'anyOf' | 'oneOf';
  branchA: number;
  branchB: number;
  severity: CollisionSeverity;
  // The labeled component name of the union itself, when tagged — for readable reporting.
  unionName?: string;
  // The labeled component each colliding branch resolves to, when tagged — the intent that sets severity.
  componentA?: string;
  componentB?: string;
}

// A one-line, human-readable rendering of a collision — for lint output, CI logs, and assertion
// failure messages when a dialect's sanity test gates on `distinguishabilityErrors`.
export function formatCollision(collision: UnionCollision): string {
  const where = collision.unionName ?? '(anonymous union)';
  const which =
    collision.componentA && collision.componentB
      ? `${collision.componentA} vs ${collision.componentB}`
      : `branches ${collision.branchA} & ${collision.branchB}`;
  return `[${collision.severity}] ${where} (${collision.mode}): ${which} not distinguishable by ref-cut local shape`;
}

export interface DistinguishabilityResult {
  // Per union schema: can ref-cut local matching always pick the right branch? Absent ⇒ never analyzed
  // (the resolver treats it as sufficient, i.e. no escalation).
  refCutSufficient: Map<Schema, boolean>;
  collisions: UnionCollision[];
}

type ResolveRef = (ref: string) => Schema;

// The JSON type(s) a schema admits, including the type implied by a `const`/`enum` when `type` is
// absent (so `{ enum: [null] }` reads as `null`, `{ const: 'x' }` as `string`). Undefined = unconstrained.
function typeSet(schema: Schema): Set<string> | undefined {
  if (schema.type) {
    return new Set(Array.isArray(schema.type) ? schema.type : [schema.type]);
  }
  // Infer the type from a `const`/`enum` — read the RAW values, not the stringified `valueSet`, or
  // every scalar would look like a string (`jsonType('null') === 'string'`).
  const raw =
    schema.const !== undefined
      ? [schema.const]
      : Array.isArray(schema.enum)
        ? schema.enum
        : undefined;
  return raw ? new Set(raw.map((value) => jsonType(value))) : undefined;
}

function jsonType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  const t = typeof value;
  // An integer-valued number reads as `integer` so it lines up with an explicit `type: 'integer'`;
  // `typesDisjoint` then handles that `integer` still overlaps `number`.
  return t === 'number' && Number.isInteger(value) ? 'integer' : t;
}

// The finite value set a schema pins via `const` or `enum`, stringified; undefined when open.
function valueSet(schema: Schema): Set<string> | undefined {
  if (schema.const !== undefined) {
    return new Set([String(schema.const)]);
  }
  if (Array.isArray(schema.enum)) {
    return new Set(schema.enum.map(String));
  }
  return undefined;
}

function disjoint(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) {
      return false;
    }
  }
  return true;
}

// Two JSON type sets with no value in common. Unlike raw set disjointness, `integer` and `number`
// overlap — every integer is a number — so a branch typed `integer` and one typed `number` are NOT
// separable (a whole number matches both).
function typesDisjoint(a: Set<string>, b: Set<string>): boolean {
  for (const ta of a) {
    for (const tb of b) {
      if (ta === tb) {
        return false;
      }
      if ((ta === 'integer' && tb === 'number') || (ta === 'number' && tb === 'integer')) {
        return false;
      }
    }
  }
  return true;
}

// Do two local shapes admit the same JSON types? Equal type sets (or both unconstrained) mean neither
// type-subsumes the other — the precondition for calling two distinct components genuinely equivalent
// (vs. one being an intentional broader superset of the other, e.g. a multi-type of a single type).
function sameTypes(a: Schema, b: Schema): boolean {
  const ta = typeSet(a);
  const tb = typeSet(b);
  if (!ta || !tb) {
    return !ta && !tb;
  }
  return ta.size === tb.size && [...ta].every((value) => tb.has(value));
}

// The property keys EVERY value matching `schema` must carry: own `required`, plus keys required by
// all allOf members, plus keys required by every branch of a oneOf/anyOf (intersection — a union only
// guarantees what all its arms do). `seen` guards recursive schemas. Operates on local shapes, where
// oneOf is already relaxed to anyOf, so both are handled the same way.
function guaranteedKeys(schema: Schema, resolveRef: ResolveRef, seen = new Set<Schema>()): Set<string> {
  if (seen.has(schema)) {
    return new Set();
  }
  seen.add(schema);
  const keys = new Set<string>(Array.isArray(schema.required) ? schema.required : []);
  for (const member of schema.allOf ?? []) {
    for (const key of guaranteedKeys(deref(member as Schema, resolveRef), resolveRef, seen)) {
      keys.add(key);
    }
  }
  for (const combinator of ['oneOf', 'anyOf'] as const) {
    const branches = schema[combinator] as Schema[] | undefined;
    if (Array.isArray(branches) && branches.length > 0) {
      const perBranch = branches.map((branch) =>
        guaranteedKeys(deref(branch, resolveRef), resolveRef, seen),
      );
      for (const key of perBranch[0]) {
        if (perBranch.every((set) => set.has(key))) {
          keys.add(key);
        }
      }
    }
  }
  return keys;
}

// Does `x` guarantee a property key that `y` forbids? `y` forbids a key when it is closed
// (`additionalProperties: false`) and doesn't declare that key — so any value satisfying `x` (which
// must carry the key) can't satisfy `y`. This is what separates a typed page kind (guarantees `type`)
// from the basic page (closed, no `type`).
function hasKeyForbiddenBy(x: Schema, y: Schema, resolveRef: ResolveRef): boolean {
  // `patternProperties` can admit a key that isn't listed in `properties`, so a closed schema with
  // patterns can't be assumed to forbid anything — stay sound and claim nothing.
  if (y.additionalProperties !== false || (y as { patternProperties?: unknown }).patternProperties != null) {
    return false;
  }
  const allowed = new Set(Object.keys(y.properties ?? {}));
  for (const key of guaranteedKeys(x, resolveRef)) {
    if (!allowed.has(key)) {
      return true;
    }
  }
  return false;
}

// Can no single value match both local shapes? Sound: returns true only on a proven separator, so an
// unprovable pair reads as non-separable (⇒ the union is flagged, ⇒ the resolver escalates).
function separable(a: Schema, b: Schema, resolveRef: ResolveRef): boolean {
  const ta = typeSet(a);
  const tb = typeSet(b);
  if (ta && tb && typesDisjoint(ta, tb)) {
    return true;
  }
  // A shared property that a value must carry (guaranteed in at least one branch) whose two shapes are
  // disjoint — by const/enum value (`type: tabs` vs `type: flow`) OR by type (a string `type` vs an
  // array `type`, telling JSONSchemaInteger from JSONSchemaMultiType). Guaranteed-in-one is what makes
  // it sound: if the property were optional in both, a value omitting it would match both branches.
  const guaranteedA = guaranteedKeys(a, resolveRef);
  const guaranteedB = guaranteedKeys(b, resolveRef);
  const aProps = (a.properties ?? {}) as Record<string, Schema>;
  for (const key of Object.keys(aProps)) {
    const aProp = aProps[key];
    const bProp = b.properties?.[key] as Schema | undefined;
    if (!bProp || (!guaranteedA.has(key) && !guaranteedB.has(key))) {
      continue;
    }
    const va = valueSet(aProp);
    const vb = valueSet(bProp);
    if (va && vb && disjoint(va, vb)) {
      return true;
    }
    const pa = typeSet(aProp);
    const pb = typeSet(bProp);
    if (pa && pb && typesDisjoint(pa, pb)) {
      return true;
    }
  }
  return hasKeyForbiddenBy(a, b, resolveRef) || hasKeyForbiddenBy(b, a, resolveRef);
}

// Whether a union carries a usable discriminator (standard `discriminator` or the Appsemble
// composite extension). A discriminated union routes by tag, so ref-cut local shape is irrelevant.
function hasDiscriminator(schema: Schema): boolean {
  const disc: Discriminator | null = readDiscriminator(schema);
  return disc != null;
}

/**
 * Walk every schema reachable from `roots`, and for each oneOf/anyOf union decide `refCutSufficient`
 * on the branches' local (ref-cut) shapes. `localShape` is the resolver's own ref-cut, so the verdict
 * reflects exactly what the resolver will see at runtime.
 */
export function analyzeDistinguishability(
  roots: Schema[],
  resolveRef: ResolveRef,
  localShape: (schema: Schema) => Schema,
): DistinguishabilityResult {
  const refCutSufficient = new Map<Schema, boolean>();
  const collisions: UnionCollision[] = [];
  const seen = new Set<Schema>();

  const analyzeUnion = (union: Schema, mode: 'anyOf' | 'oneOf', branches: Schema[]): void => {
    if (hasDiscriminator(union)) {
      refCutSufficient.set(union, true);
      return;
    }
    const unionLabeled = schemaTag(union) != null;
    const shapes = branches.map((branch) => localShape(deref(branch, resolveRef)));
    const names = branches.map((branch) => schemaTag(deref(branch, resolveRef))?.name);
    let ok = true;
    for (let i = 0; i < shapes.length; i += 1) {
      for (let j = i + 1; j < shapes.length; j += 1) {
        if (!separable(shapes[i], shapes[j], resolveRef)) {
          ok = false;
          const componentA = names[i];
          const componentB = names[j];
          const distinctComponents = componentA != null && componentB != null && componentA !== componentB;
          // A labeling-vs-shape contradiction — two distinct labeled components with the SAME local
          // shape, indistinguishable in either direction — is the strongest signal. When one merely
          // subsumes the other by type (an intentional broader form), the overlap is structural (info).
          // A labeled union whose own unlabeled forms overlap identifies right but over-broadens (warning).
          const severity: CollisionSeverity = distinctComponents
            ? sameTypes(shapes[i], shapes[j])
              ? 'error'
              : 'info'
            : unionLabeled
              ? 'warning'
              : 'info';
          collisions.push({
            schema: union,
            mode,
            branchA: i,
            branchB: j,
            severity,
            unionName: schemaTag(union)?.name,
            componentA,
            componentB,
          });
        }
      }
    }
    refCutSufficient.set(union, ok);
  };

  const visit = (schema: Schema): void => {
    const resolved = deref(schema, resolveRef);
    if (seen.has(resolved)) {
      return;
    }
    seen.add(resolved);

    for (const mode of ['oneOf', 'anyOf'] as const) {
      const branches = resolved[mode] as Schema[] | undefined;
      if (Array.isArray(branches) && branches.length > 1) {
        analyzeUnion(resolved, mode, branches);
      }
    }
    for (const child of subschemas(resolved)) {
      visit(child);
    }
  };

  for (const root of roots) {
    visit(root);
  }
  return { refCutSufficient, collisions };
}

// Every immediate subschema of `schema` the resolver can descend into: properties, array items,
// object additionalProperties, and combinator branches. Refs are yielded as-is; `visit` derefs them.
function* subschemas(schema: Schema): Iterable<Schema> {
  for (const property of Object.values(schema.properties ?? {})) {
    yield property as Schema;
  }
  if (schema.items && typeof schema.items === 'object') {
    if (Array.isArray(schema.items)) {
      yield* schema.items as Schema[];
    } else {
      yield schema.items as Schema;
    }
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    yield schema.additionalProperties as Schema;
  }
  for (const combinator of ['allOf', 'anyOf', 'oneOf'] as const) {
    const branches = schema[combinator] as Schema[] | undefined;
    if (Array.isArray(branches)) {
      yield* branches;
    }
  }
}
