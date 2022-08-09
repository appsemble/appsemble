import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from './utils.js';

export const JSONSchemaOneOf = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description:
    'A JSON schema which determines the value must match exactly one of the given schemas.',
  additionalProperties: false,
  required: ['oneOf'],
  properties: {
    oneOf: {
      type: 'array',
      description: 'The JSON schema must match exactly one of the given schemas.',
      items: {
        $ref: '#/components/schemas/JSONSchema',
      },
    },
    example: {
      description: 'An example value which is valid according to this schema.',
    },
    default: {
      description: 'The default value which is used if no value is supplied.',
    },
  },
});
