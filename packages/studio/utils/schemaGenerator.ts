import { type Schema } from 'jsonschema';
import { type JsonValue } from 'type-fest';

/**
 * Generates data for certain blocks acording to a preset configuration of default values
 */
export const generateDataFromConfiguration = (
  definitions: Record<string, Schema>,
  schema?: Schema,
  blockName?: string,
): JsonValue => {
  if (blockName === '@appsemble/form') {
    return {
      dense: false,
      disableDefault: false,
      disabled: false,
      fields: [
        {
          defaultValue: '',
          disabled: false,
          icon: 'fas fa-home',
          inline: true,
          label: 'label',
          name: '',
          placeholder: 'placeholder',
          readOnly: false,
          requirements: [],
          show: 'show',
          tag: 'tag',
          type: 'string',
        },
      ],
      previous: false,
      requirements: [],
      skipInitialLoad: false,
    };
  }
};

/**
 * Generates values for each type in a Schema.
 * This is done to allow new blocks made with the GUI Editor to have default values
 */

export const generateData = (
  definitions: Record<string, Schema>,
  schema?: Schema,
  blockName?: string,
): JsonValue => {
  if (!schema) {
    return;
  }

  // Set configurations for certain blocks
  if (blockName) {
    const blockConfigs = ['@appsemble/form'];
    if (blockConfigs.includes(blockName)) {
      return generateDataFromConfiguration(definitions, schema, blockName);
    }
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
        // This is a workaround for the form block
        if (key !== 'autofill') {
          data[key] = generateData(definitions, schema.properties[key], key);
        }
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
    if (schema.const) {
      return schema.const;
    }
    return schema.default ?? blockName;
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
    if (schema.const) {
      return schema.const;
    }
    return schema.default ?? false;
  }
  return null;
};
