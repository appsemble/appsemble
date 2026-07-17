import type { FromSchema, JSONSchema } from '@ngruychev/json-schema-to-ts';

import { type Components } from './overlay.js';

/**
 * OPT-IN schema-derivation helper for the type overlay — the ONLY part that touches `FromSchema` and
 * so the published `@ngruychev/json-schema-to-ts` fork's `ignoreRefSiblings` option (draft-07). A
 * consumer who does not hand-write value types can derive them from `const` schema literals here and
 * feed the result to the overlay's `Components` registry. Everything recursive/deep lives behind this
 * boundary; the core cursor (overlay.ts) never imports it, so its recursion-safety is unconditional.
 *
 * The generic bound is json-schema-to-ts's `JSONSchema` (needs the `const`-narrowed literal), not
 * jsonschema's runtime `Schema`. `LocalValue` (shallow, `$ref` -> `unknown`) is finite/cheap/
 * recursion-proof — the type-level mirror of the runtime ref-cut; `LCValue` (deep, follows `$ref`s)
 * over-instantiates on unbounded recursion (TS 5.9), so it stays bounded/opt-in. Use `LocalValue` + a
 * recursive interface, or hand-written types, for cyclic components — see overlay.ts.
 */

// A schema carrying a `$id`, the shape `FromSchema` resolves a `$ref` against. Mirrors
// json-schema-to-ts's internal `JSONSchemaReference` (not re-exported from the package root).
export type JSONSchemaReference = JSONSchema & Readonly<{ $id: string }>;

// Shallow value type: `$ref`s are NOT followed, they widen to `unknown`. Finite, cheap, recursion-
// proof — the type-level ref-cut. The default building block for a `Components` entry.
export type LocalValue<Comp extends JSONSchema> = FromSchema<Comp>;

// Deep value type: follows `$ref`s into `Refs`, draft-07 `$ref`-sibling semantics. Bounded schemas
// only on TS 5.9 (unbounded recursion over-instantiates); prefer `LocalValue` + a named recursive
// interface for cyclic components.
export type LCValue<Comp extends JSONSchema, Refs extends JSONSchemaReference[] = []> = FromSchema<
  Comp,
  { references: Refs; ignoreRefSiblings: true }
>;

// The `$id` a schema is keyed by in a reference set.
export type ComponentName<Comp> = Comp extends { $id: infer Id extends string } ? Id : never;

// Derive a `Components` registry (name -> shallow value type) from a set of `const` schema references,
// keyed by each schema's `$id`. The opt-in bridge from schema literals to the overlay's value types.
export type DeriveComponents<Refs extends JSONSchemaReference[]> = {
  [Ref in Refs[number] as ComponentName<Ref>]: LocalValue<Ref>;
} & Components;
