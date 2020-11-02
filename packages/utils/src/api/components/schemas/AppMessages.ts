import { OpenAPIV3 } from 'openapi-types';

export const AppMessages: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The response object of an messages create call.',
  required: ['language', 'messages'],
  properties: {
    language: { type: 'string', description: 'The language the messages represent.' },
    messages: {
      type: 'object',
      description: 'A mapping of the messages for this language',
      additionalProperties: { type: 'string' },
    },
  },
};
