import { OpenAPIV3 } from 'openapi-types';

export const AppMessages: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The response object of an messages create call.',
  required: ['language', 'messages'],
  additionalProperties: false,
  properties: {
    language: { type: 'string', description: 'The language the messages represent.' },
    messages: { $ref: '#/components/schemas/AppsembleMessages' },
    force: {
      type: 'boolean',
      writeOnly: true,
      description: 'If this is true, the app lock is ignored.',
    },
  },
};
