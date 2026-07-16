import { type Schema, type ValidationError } from 'jsonschema';

declare module 'jsonschema' {
  interface Schema {
    appsembleLanguageComponent?: SchemaTag;
  }
}

/*
 * Vocabulary, in the order data flows:
 *   SchemaTag  the static `{ name, mode }` annotation declared on a schema (under COMPONENT_KEY).
 *   Identity   the resolved classification of a node (the union below) — what the walk computes
 *              from the tag against the value.
 *   Mount      an Identity located at a JSON Pointer (path + localValid + errors, no value) — what
 *              `buildTree` produces.
 *   ScanHit    a side-channel breadcrumb (not in that chain) recorded when the validator touches a
 *              tagged node during document validation.
 *
 * TagMode ('single'|'oneOf'|'anyOf'|'allOf', the declared shape) and Identity.kind differ on
 * purpose: TagMode 'single' -> kind 'single'; the combinator TagModes -> kind 'composite'.
 */

export type NodePath = readonly (number | string)[];

export type TagMode = 'allOf' | 'anyOf' | 'oneOf' | 'single';

export interface SchemaTag {
  name: string;
  mode?: TagMode;
}

// The schema keyword the analyzer reads identities from and the annotator writes,
// declared on `Schema` by the module augmentation above.
export const COMPONENT_KEY = 'appsembleLanguageComponent';

// A schema known to carry the language component tag. Producers (e.g. `LanguageComponent.define`,
// `withTag`) return this so the tag is guaranteed at the type level; `isTagged` narrows a plain
// `Schema` to it. The augmentation keeps the tag optional on every `Schema`; this names the subset
// that definitely has it.
export type TaggedSchema = Schema & Record<typeof COMPONENT_KEY, SchemaTag>;

// Read a language component tag from a schema, or undefined when untagged.
export function schemaTag(schema: Schema): SchemaTag | undefined {
  return schema[COMPONENT_KEY];
}

// Whether a schema carries the language component tag; narrows to `TaggedSchema`.
export function isTagged(schema: Schema): schema is TaggedSchema {
  return schema[COMPONENT_KEY] != null;
}

export interface ScanHit {
  path: NodePath;
  tag: SchemaTag;
  schema: Schema;
}

// The resolved identity, a discriminated union on `kind` so the field correlations are types, not
// conventions: a single named component; a composite carrying its combinator `mode` and governing
// branch `parts`; or unresolved, carrying the `reason` and the `parts` that were considered.
export type Identity = SingleIdentity | CompositeIdentity | UnresolvedIdentity;

export interface SingleIdentity {
  kind: 'single';
  name: string;
}

export interface CompositeIdentity {
  kind: 'composite';
  name: string;
  mode: 'allOf' | 'anyOf' | 'oneOf';
  parts: Identity[];
}

export interface UnresolvedIdentity {
  kind: 'unresolved';
  name: string;
  reason: string;
  parts: Identity[];
}

// An Identity mounted at a data path. `localValid` = does the value satisfy its own (ref-cut)
// schema; `localErrors` = that node's own ref-cut failures (from the walk); `errors` = whole-document
// errors at or below this path (from `validate`, empty until then). No value stored — read it via
// `MountIndex.valueAt`, so a mount reused across incremental rebuilds can't carry a stale value.
export interface Mount {
  path: NodePath;
  identity: Identity;
  localValid: boolean;
  localErrors: ValidationError[];
  errors: ValidationError[];
}
