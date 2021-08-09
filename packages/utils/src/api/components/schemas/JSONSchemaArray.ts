import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

export const JSONSchemaArray = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for an array.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['array'],
      description: 'The type of the JSON schema. An array means a list of data.',
    },
    example: {
      // @ts-expect-error This is valid despite the type error.
      type: 'array',
      description: 'An example array which is valid according to this schema.',
    },
    default: {
      // @ts-expect-error This is valid despite the type error.
      type: 'array',
      description: 'The default value which is used if no value is supplied.',
    },
    maxItems: {
      type: 'integer',
      description: 'The minimum amount of items the array is allowed to have.',
      minimum: 1,
    },
    minItems: {
      type: 'integer',
      description: 'The maximum amount of items the array is allowed to have.',
      minimum: 0,
    },
    uniqueItems: {
      type: 'boolean',
      description: 'If true, all items in the array need to be unique',
      default: false,
    },
    items: {
      $ref: '#/components/schemas/JSONSchema',
      description: 'This property describes what the items in an array should look like.',
    },
  },
});
