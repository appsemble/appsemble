import { OpenAPIV3 } from 'openapi-types';

export const SecurityDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes how the app is secured.',
  required: ['default', 'roles'],
  properties: {
    default: { $ref: '#/components/schemas/SecurityDefaultDefinition' },
    roles: {
      type: 'object',
      additionalProperties: { $ref: '#/components/schemas/SecurityRoleDefinition' },
    },
  },
};
