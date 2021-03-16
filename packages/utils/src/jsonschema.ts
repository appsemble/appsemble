import { Schema } from 'jsonschema';
import { JsonArray, JsonValue } from 'type-fest';

import { mapValues } from './mapValues';

declare module 'jsonschema' {
  /**
   * See https://github.com/tdegrunt/jsonschema/pull/335
   */
  interface Schema {
    default?: JsonValue;
    examples?: JsonArray;
  }
}

/**
 * Generate data based on a JSON schema.
 *
 * The generated data doesn’t necessarily conform to the JSON schema. This is useful to prefill
 * forms that are based on a JSON schema, but where user input is still needed to verify the data.
 *
 * @param schema - The JSON schema to generate data from.
 * @returns A JSON value estimated from the schema.
 */
export function generateDataFromSchema(schema?: Schema): JsonValue {
  if (!schema) {
    return;
  }
  // Let’s assume the default conforms to the schema, although this might not be true.
  if ('default' in schema) {
    return schema.default;
  }
  // If no predefined value exists, generate something based on its type.
  switch (schema.type) {
    case 'array':
      return Array.from({ length: schema.minItems }, (empty, index) =>
        generateDataFromSchema(
          Array.isArray(schema.items)
            ? schema.items[index] ||
                (typeof schema.additionalItems === 'object' && schema.additionalItems)
            : schema.items,
        ),
      );
    case 'boolean':
      return false;
    case 'integer':
    case 'number': {
      const {
        maximum = 0,
        minimum = 0,
        multipleOf = schema.type === 'integer' ? 1 : undefined,
      } = schema;
      if (minimum > 0) {
        return multipleOf ? minimum + multipleOf - (minimum % multipleOf) : minimum;
      }
      if (maximum < 0) {
        return multipleOf ? maximum - multipleOf + (-maximum % multipleOf) : maximum;
      }
      return 0;
    }
    case 'null':
      return null;
    case 'object':
      return mapValues(schema.properties || {}, generateDataFromSchema);
    case 'string':
      return '';
    default:
      break;
  }
}
