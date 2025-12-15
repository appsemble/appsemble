import { type Schema } from 'jsonschema';
import lcm from 'lcm';
import { type JsonArray, type JsonValue } from 'type-fest';

import { mapValues } from './mapValues.js';

// XXX: This is holding back `jsonschema` from being updated to 1.5
declare module 'jsonschema' {
  /**
   * See https://github.com/tdegrunt/jsonschema/pull/335
   */
  interface Schema {
    default?: JsonValue;
    examples?: JsonArray;

    /**
     * Descriptions for enum values.
     *
     * This is a JSON schema extension that’s supported by Monaco editor, and also used in Appsemble
     * Studio.
     */
    enumDescriptions?: string[];

    /**
     * If true, Appsemble renders a textarea in the graphical JSON editor.
     *
     * This is a custom property used by Appsemble.
     */
    multiline?: boolean;
  }

  interface SchemaContext {
    path: (number | string)[];
  }
}

/**
 * Generate data based on a JSON schema.
 *
 * The generated data doesn’t necessarily conform to the JSON schema. This is useful to prefill
 * forms that are based on a JSON schema, but where user input is still needed to verify the data.
 *
 * @param schema The JSON schema to generate data from.
 * @returns A JSON value estimated from the schema.
 */
export function generateDataFromSchema(schema?: Schema): JsonValue {
  if (!schema) {
    return null;
  }
  // Let’s assume the default conforms to the schema, although this might not be true.
  if ('default' in schema) {
    return schema.default ?? null;
  }
  // If no predefined value exists, generate something based on its type.
  switch (schema.type) {
    case 'array':
      return Array.from({ length: schema.minItems ?? 0 }, (empty, index) =>
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
  return null;
}

/**
 * Combine a list of schemas into one schema matching all of them.
 *
 * The main purpose of this function is to combine a schema using `allOf` into one schema that can
 * be rendered. Do not use this for actual validation. Use the original `allOf` schema instead.
 *
 * @param schemas The schemas to combine.
 * @returns The combined schema.
 */
export function combineSchemas(...schemas: Schema[]): Schema {
  const result: Schema = {};

  for (const schema of schemas) {
    if ('type' in schema) {
      result.type ||= schema.type;
    }
    if ('format' in schema) {
      result.format ||= schema.format;
    }
    if ('minimum' in schema) {
      result.minimum =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        'minimum' in result ? Math.max(result.minimum, schema.minimum) : schema.minimum;
    }
    if ('minLength' in schema) {
      result.minLength =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        'minLength' in result ? Math.max(result.minLength, schema.minLength) : schema.minLength;
    }
    if ('maximum' in schema) {
      result.maximum =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        'maximum' in result ? Math.min(result.maximum, schema.maximum) : schema.maximum;
    }
    if ('maxLength' in schema) {
      result.maxLength =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        'maxLength' in result ? Math.min(result.maxLength, schema.maxLength) : schema.maxLength;
    }
    if (schema.multipleOf) {
      result.multipleOf = result.multipleOf
        ? lcm(result.multipleOf, schema.multipleOf)
        : schema.multipleOf;
    }
    if ('default' in schema) {
      result.default ??= schema.default;
    }
    if (schema.description) {
      result.description ||= schema.description;
    }
    if (schema.pattern) {
      result.pattern ||= schema.pattern;
    }
    if (schema.title) {
      result.title ||= schema.title;
    }
    if ('uniqueItems' in schema) {
      result.uniqueItems ||= schema.uniqueItems;
    }
    if (Array.isArray(schema.required)) {
      result.required ||= [];
      if (Array.isArray(result.required)) {
        result.required.push(...schema.required);
      }
    } else if (schema.required) {
      result.required = true;
    }
    if (schema.properties) {
      result.properties ||= {};
      for (const [key, property] of Object.entries(schema.properties)) {
        result.properties[key] = result.properties[key]
          ? combineSchemas(result.properties[key], property)
          : property;
      }
    }
  }

  return result;
}

/**
 * Recursively iterate over a JSON schema and call the callback with every sub schema found.
 *
 * @param schema The JSON schema to iterate.
 * @param onSchema The callback to call with the found JSON schema.
 */
export function iterJSONSchema(schema: Schema, onSchema: (schema: Schema) => void): void {
  if (!schema) {
    return;
  }
  onSchema(schema);

  if (schema.properties) {
    for (const property of Object.values(schema.properties)) {
      iterJSONSchema(property, onSchema);
    }
  }

  if (typeof schema.additionalProperties === 'object') {
    iterJSONSchema(schema.additionalProperties, onSchema);
  }

  if (schema.items) {
    if (Array.isArray(schema.items)) {
      for (const item of schema.items) {
        iterJSONSchema(item, onSchema);
      }
    } else {
      iterJSONSchema(schema.items, onSchema);
    }
  }

  if (typeof schema.additionalItems === 'object') {
    iterJSONSchema(schema.additionalItems, onSchema);
  }

  if (schema.anyOf) {
    for (const anyOf of schema.anyOf) {
      iterJSONSchema(anyOf, onSchema);
    }
  }

  if (schema.oneOf) {
    for (const oneOf of schema.oneOf) {
      iterJSONSchema(oneOf, onSchema);
    }
  }

  if (schema.allOf) {
    for (const allOf of schema.allOf) {
      iterJSONSchema(allOf, onSchema);
    }
  }
}
