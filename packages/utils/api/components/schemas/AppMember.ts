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
  },
};
