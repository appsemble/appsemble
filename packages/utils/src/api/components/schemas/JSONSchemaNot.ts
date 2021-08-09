import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

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
    example: {
      description: 'An example value which is valid according to this schema.',
    },
    default: {
      description: 'The default value which is used if no value is supplied.',
    },
  },
});
