import { type OpenAPIV3 } from 'openapi-types';

export const UsersDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Definition for user properties.',
  required: [],
  additionalProperties: false,
  properties: {
    properties: {
      type: 'object',
      description: 'The properties object configuring users in the app',
      additionalProperties: {
        description: 'A single user property definition.',
        $ref: '#/components/schemas/UserPropertyDefinition',
      },
    },
  },
};
