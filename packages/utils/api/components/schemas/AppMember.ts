import { type OpenAPIV3 } from 'openapi-types';

export const AppMember: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object representing a member of an app',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description: 'The id of the app member.',
    },
    role: {
      type: 'string',
      description: 'The role of the app member within the app.',
    },
    name: {
      type: 'string',
      description: 'The full name of the app member.',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'The email address of the app member.',
    },
  },
};
