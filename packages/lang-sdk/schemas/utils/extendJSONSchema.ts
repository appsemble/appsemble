import { type OpenAPIV3 } from 'openapi-types';

import { has } from '../../miscellaneous.js';

/**
 * Extend a JSON schema by copying its properties.
 *
 * This creates a new schema based on the input schema, where `required` and `properties` are
 * inherited from the `base` schema.
 *
 * @param base The base schema whose properties to inherit.
 * @param schema The schema overriding the base schema.
 * @param omit Properties to omit from the base schema.
 * @returns The schema which extends the base schema.
 */
export function extendJSONSchema(
  base: OpenAPIV3.SchemaObject,
  schema: OpenAPIV3.SchemaObject,
  omit: string[] = [],
): OpenAPIV3.SchemaObject {
  const result = { ...schema };

  const required = Array.isArray(schema.required) ? [...schema.required] : [];
  if (Array.isArray(base.required)) {
    for (const name of base.required) {
      if (!required.includes(name) && !omit.includes(name)) {
        required.push(name);
      }
    }
  }
  if (required.length) {
    result.required = required;
  }

  result.properties = { ...schema.properties };
  for (const [name, property] of Object.entries(base.properties ?? {})) {
    if (!omit.includes(name) && !has(result.properties, name)) {
      result.properties[name] = property;
    }
  }

  return result;
}
