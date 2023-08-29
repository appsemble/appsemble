import { mapValues } from '@appsemble/utils';
import { type Schema } from 'jsonschema';
import { type JsonValue } from 'type-fest';

/**
 * Generates values for each type in a Schema.
 * This is done to allow new blocks made with the GUI Editor to have default values
 */

export const generateData = (
  definitions: Record<string, Schema>,
  schema?: Schema,
  ownerKey = '',
): JsonValue => {
  if (!schema) {
    return;
  }
  if (schema.$ref) {
    const ref = decodeURIComponent(schema.$ref.split('/').pop());
    return generateData(definitions, definitions[ref!] as Schema);
  }
  if (schema.default) {
    return schema.default;
  }
  if (schema.type === 'object') {
    const data: Record<string, JsonValue> = {};
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        data[key] = generateData(definitions, schema.properties[key], key);
      }
    }
    return data;
  }
  if (schema.anyOf) {
    return [generateData(definitions, schema.anyOf[0])];
  }
  if (schema.oneOf) {
    return generateData(definitions, schema.oneOf[0]);
  }
  if (schema.allOf) {
    const allOf = [];
    for (const allOfSchema of schema.allOf) {
      allOf.push(generateData(definitions, allOfSchema));
    }
    return allOf;
  }
  if (schema.enum) {
    return schema.enum[0];
  }
  if (schema.format === 'remapper') {
    return schema.default ?? ownerKey;
  }
  if (schema.type === 'array') {
    const firstArray = Array.from({ length: schema.minItems }, (empty, index) =>
      generateData(
        definitions,
        Array.isArray(schema.items)
          ? schema.items[index] ||
              (typeof schema.additionalItems === 'object' && schema.additionalItems)
          : schema.items,
      ),
    );
    // This is somehow a double array in the form block 'fields' therefore we check index 0
    return Array.isArray(firstArray[0]) ? firstArray[0] : firstArray;
  }
  if (schema.type === 'string') {
    if (schema.format === 'fontawesome') {
      return 'fas fa-home';
    }
    if (schema.const) {
      return schema.const;
    }
    return schema.default ?? '';
  }
  if (schema.type === 'number') {
    return schema.default ?? 0;
  }
  if (schema.type === 'boolean') {
    return schema.default ?? false;
  }
  if (schema.type === 'object') {
    return mapValues(schema.properties || {}, generateData);
  }
  return null;
};
