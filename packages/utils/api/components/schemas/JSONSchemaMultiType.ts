import { BaseJSONSchema } from './BaseJSONSchema';
import { JSONSchemaArray } from './JSONSchemaArray';
import { JSONSchemaInteger } from './JSONSchemaInteger';
import { JSONSchemaObject } from './JSONSchemaObject';
import { JSONSchemaString } from './JSONSchemaString';
import { extendJSONSchema } from './utils';

export const JSONSchemaMultiType = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema which defines multiple types.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      type: 'array',
      uniqueItems: true,
      minItems: 2,
      description: 'The type of the JSON schema. It’s recommended to use only one.',
      items: {
        enum: ['array', 'boolean', 'integer', 'null', 'number', 'string'],
      },
    },
    example: {
      description: 'An example which is valid according to this schema.',
    },
    default: {
      description: 'The default value which is used if no value is supplied.',
    },
    maxItems: JSONSchemaArray.properties.maxItems,
    minItems: JSONSchemaArray.properties.minItems,
    uniqueItems: JSONSchemaArray.properties.uniqueItems,
    items: JSONSchemaArray.properties.items,
    minimum: JSONSchemaInteger.properties.minimum,
    maximum: JSONSchemaInteger.properties.maximum,
    multipleOf: JSONSchemaInteger.properties.multipleOf,
    maxProperties: JSONSchemaObject.properties.maxProperties,
    minProperties: JSONSchemaObject.properties.minProperties,
    properties: JSONSchemaObject.properties.properties,
    required: JSONSchemaObject.properties.required,
    additionalProperties: JSONSchemaObject.properties.additionalProperties,
    format: JSONSchemaString.properties.format,
    minLength: JSONSchemaString.properties.minLength,
    maxLength: JSONSchemaString.properties.maxLength,
    pattern: JSONSchemaString.properties.pattern,
  },
});
