import { type Schema } from 'jsonschema';

import { META_KEY, type MetaMode, metaTag } from './types.js';

export function metaMode(schema: Schema): MetaMode | null {
  if (schema.oneOf) {
    return 'oneOf';
  }
  if (schema.anyOf) {
    return 'anyOf';
  }
  if (schema.allOf) {
    return 'allOf';
  }
  if (schema.type === 'object' || schema.properties) {
    return 'object';
  }
  return null;
}

/**
 * Tag one schema as a meta-object under `metaKey` so the analyzer mounts an identity for
 * it. Only object and combinator schemas are tagged; anything else, and any schema that
 * already carries the tag, is returned unchanged.
 *
 * @param schema The schema to annotate.
 * @param name The identity name to record on the tag.
 * @param metaKey The keyword to write the tag under (defaults to META_KEY).
 * @returns The annotated schema, or the schema unchanged when it is not taggable.
 */
export function annotateSchema(schema: Schema, name: string, metaKey: string = META_KEY): Schema {
  if (!schema || typeof schema !== 'object' || metaTag(schema, metaKey)) {
    return schema;
  }
  const mode = metaMode(schema);
  return mode ? { ...schema, [metaKey]: { name, mode } } : schema;
}

/**
 * Tag every schema in a `name -> schema` registry as a meta-object, using each key as the
 * identity name. The analyzer derives identities only from these tags, so this opts an
 * otherwise-unannotated schema set (e.g. the Appsemble schemas) into the analyzer.
 *
 * @param schemas The registry of named schemas.
 * @param metaKey The keyword to write the tag under (defaults to META_KEY).
 * @returns A new registry with each taggable schema annotated by its key.
 */
export function annotateSchemas(
  schemas: Record<string, Schema>,
  metaKey: string = META_KEY,
): Record<string, Schema> {
  return Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, annotateSchema(schema, name, metaKey)]),
  );
}
