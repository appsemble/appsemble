import { type Schema, type ValidationError } from 'jsonschema';

declare module 'jsonschema' {
  interface Schema {
    appsembleLanguageComponent?: SchemaTag;
  }
}

/*
 * Vocabulary of the engine, in the order data flows through it:
 *
 *   SchemaTag  the static annotation written on a schema (`{ name, mode }` under
 *              COMPONENT_KEY) — what you declare.
 *      |  resolve() reads the tag against the value
 *      v
 *   Identity   the resolved classification of a node: a single named component, a
 *              composite of parts, or unresolved — what the walk computes.
 *      |  emitted at a data path
 *      v
 *   Mount      an Identity located in the document (path + value + localValid + errors),
 *              keyed by JSON Pointer — what `buildTree` produces.
 *
 *   ScanHit    a side-channel, not part of that chain: a breadcrumb recorded when the
 *              validator physically touches a tagged node during document validation.
 *
 * Two `mode` vocabularies exist on purpose and only partly overlap:
 *   - TagMode (on SchemaTag): 'single' | 'oneOf' | 'anyOf' | 'allOf' — the declared shape.
 *   - Identity.kind: 'single' | 'composite' | 'unresolved', with Identity.mode carrying
 *     the combinator ('oneOf' | 'anyOf' | 'allOf') only for a composite.
 *   TagMode 'single' maps to kind 'single'; the combinator TagModes map to kind 'composite'
 *   carrying that mode. 'single' is never an Identity.mode.
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

// The resolved identity algebra: a single named identity, a composite of parts,
// or unresolved (with the reason and the candidate parts that were considered).
export interface Identity {
  kind: 'composite' | 'single' | 'unresolved';
  name: string;
  mode?: 'allOf' | 'anyOf' | 'oneOf';
  parts: Identity[];
  reason?: string;
}

// An Identity mounted at a concrete data path. `localValid` is whether the value
// satisfies its own schema; whole-document validity lives on the analysis result,
// not here. `errors` are the validation errors at or below this path. The value
// itself is not stored — read it through `MountTree.valueAt(path)`, so a mount
// reused across incremental rebuilds can never carry a stale value.
export interface Mount {
  path: NodePath;
  identity: Identity;
  localValid: boolean;
  errors: ValidationError[];
}
