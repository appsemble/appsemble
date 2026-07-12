import { type Schema } from 'jsonschema';

import { COMPONENT_KEY, type TagMode, schemaTag } from './types.js';

export function tagMode(schema: Schema): TagMode | null {
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
    return 'single';
  }
  return null;
}

/**
 * Tag one schema as a language component so the analyzer mounts an identity for it. Only
 * object and combinator schemas are tagged; anything else, and any schema that already
 * carries the tag, is returned unchanged.
 *
 * @param schema The schema to annotate.
 * @param name The identity name to record on the tag.
 * @returns The annotated schema, or the schema unchanged when it is not taggable.
 */
export function annotateSchema(schema: Schema, name: string): Schema {
  if (!schema || typeof schema !== 'object' || schemaTag(schema)) {
    return schema;
  }
  const mode = tagMode(schema);
  return mode ? { ...schema, [COMPONENT_KEY]: { name, mode } } : schema;
}

/**
 * Tag every schema in a `name -> schema` registry as a language component, using each key as the
 * identity name. The analyzer derives identities only from these tags, so this opts an
 * otherwise-unannotated schema set (e.g. the Appsemble schemas) into the analyzer.
 *
 * @param schemas The registry of named schemas.
 * @returns A new registry with each taggable schema annotated by its key.
 */
export function annotateSchemas(schemas: Record<string, Schema>): Record<string, Schema> {
  return Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, annotateSchema(schema, name)]),
  );
}
