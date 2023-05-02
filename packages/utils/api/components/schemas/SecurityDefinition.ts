import { type OpenAPIV3 } from 'openapi-types';

export const SecurityDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes how the app is secured.',
  required: ['default', 'roles'],
  additionalProperties: false,
  properties: {
    default: { $ref: '#/components/schemas/SecurityDefaultDefinition' },
    roles: {
      type: 'object',
      description: 'This property defines the user roles that are available within the app.',
      minProperties: 1,
      additionalProperties: { $ref: '#/components/schemas/SecurityRoleDefinition' },
    },
    teams: {
      $ref: '#/components/schemas/TeamsDefinition',
      description: 'Define how teams are handled by the app.',
    },
  },
};
