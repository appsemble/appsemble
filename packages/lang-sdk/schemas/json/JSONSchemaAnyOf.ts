import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const JSONSchemaAnyOf = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description:
    'A JSON schema which determines the value must match one or more of the given schemas.',
  additionalProperties: false,
  required: ['anyOf'],
  properties: {
    anyOf: {
      type: 'array',
      description: 'The JSON schema must match one or more of the given schemas.',
      items: {
        $ref: '#/components/schemas/JSONSchema',
      },
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
