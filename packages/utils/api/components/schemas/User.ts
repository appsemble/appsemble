import { type OpenAPIV3 } from 'openapi-types';

export const User: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object representing a user',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description: 'The id of the user.',
    },
  },
};
