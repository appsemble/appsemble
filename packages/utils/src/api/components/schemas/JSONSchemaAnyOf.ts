import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

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
    example: {
      description: 'An example value which is valid according to this schema.',
    },
    default: {
      description: 'The default value which is used if no value is supplied.',
    },
  },
});
