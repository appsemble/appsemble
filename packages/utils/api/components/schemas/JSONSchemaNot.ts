import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from './utils.js';

export const JSONSchemaNot = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema which may not be matched.',
  additionalProperties: false,
  required: ['not'],
  properties: {
    not: {
      $ref: '#/components/schemas/JSONSchema',
      description: 'The JSON schema which the value may not match.',
    },
    examples: {
      type: 'array',
      description: 'An example value which is valid according to this schema.',
      items: {},
    },
    default: {
      description: 'The default value which is used if no value is supplied.',
    },
  },
});
