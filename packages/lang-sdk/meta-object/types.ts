import { type Schema, type ValidationError } from 'jsonschema';

declare module 'jsonschema' {
  interface Schema {
    appsembleMetaObject?: MetaTag;
  }
}

export type MetaObjectPath = readonly (number | string)[];

export type MetaMode = 'allOf' | 'anyOf' | 'object' | 'oneOf';

export interface MetaTag {
  name: string;
  mode?: MetaMode;
}

// The schema keyword the analyzer reads identities from and the annotator writes.
// Configurable per analyzer/annotator call; this is the default. The `Schema`
// augmentation above must use the literal, so keep the two in sync if it changes.
export const META_KEY = 'appsembleMetaObject';

// Read a meta-object tag from a schema under `key` (defaults to META_KEY).
export function metaTag(schema: Schema, key: string = META_KEY): MetaTag | undefined {
  return (schema as Record<string, unknown>)[key] as MetaTag | undefined;
}

export interface MetaHit {
  path: MetaObjectPath;
  tag: MetaTag;
  schema: Schema;
}

// The resolved identity algebra: a single named identity, a composite of parts,
// or unresolved (with the reason and the candidate parts that were considered).
export interface MetaIdentity {
  kind: 'composite' | 'single' | 'unresolved';
  name: string;
  mode?: 'allOf' | 'anyOf' | 'oneOf';
  parts: MetaIdentity[];
  reason?: string;
}

// A MetaIdentity mounted at a concrete data path. `localValid` is whether the value
// satisfies its own schema; whole-document validity lives on the analysis result,
// not here. `errors` are the validation errors at or below this path.
export interface MetaInterpretation {
  path: MetaObjectPath;
  value: unknown;
  identity: MetaIdentity;
  localValid: boolean;
  errors: ValidationError[];
}
