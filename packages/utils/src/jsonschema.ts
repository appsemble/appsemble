import { Schema } from 'jsonschema';
import { JsonValue } from 'type-fest';

import { mapValues } from './mapValues';

declare module 'jsonschema' {
  interface Schema {
    default?: JsonValue;
  }
}

export function generateDataFromSchema(schema?: Schema): JsonValue {
  if (!schema) {
    return;
  }
  if ('default' in schema) {
    return schema.default;
  }
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
      const { exclusiveMaximum, exclusiveMinimum, maximum, minimum, multipleOf } = schema;
      let value = 0;
      if (minimum > 0) {
        value = minimum;
      } else if (maximum < 0) {
        value = maximum;
      }
      return value;
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
