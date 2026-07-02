import { type Schema, type ValidationError } from 'jsonschema';

declare module 'jsonschema' {
  interface Schema {
    appsembleLanguageComponent?: SchemaTag;
  }
}

export type NodePath = readonly (number | string)[];

export type TagMode = 'allOf' | 'anyOf' | 'oneOf' | 'single';

export interface SchemaTag {
  name: string;
  mode?: TagMode;
}

// The schema keyword the analyzer reads identities from and the annotator writes.
// Configurable per analyzer/annotator call; this is the default. The `Schema`
// augmentation above must use the literal, so keep the two in sync if it changes.
export const COMPONENT_KEY = 'appsembleLanguageComponent';

// Read a language component tag from a schema under `key` (defaults to COMPONENT_KEY).
export function schemaTag(schema: Schema, key: string = COMPONENT_KEY): SchemaTag | undefined {
  return (schema as Record<string, unknown>)[key] as SchemaTag | undefined;
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

// A Identity mounted at a concrete data path. `localValid` is whether the value
// satisfies its own schema; whole-document validity lives on the analysis result,
// not here. `errors` are the validation errors at or below this path.
export interface Mount {
  path: NodePath;
  value: unknown;
  identity: Identity;
  localValid: boolean;
  errors: ValidationError[];
}
