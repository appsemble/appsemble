import { type OpenAPIV3 } from 'openapi-types';

export const SecurityDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes how the app is secured.',
  additionalProperties: false,
  properties: {
    default: { $ref: '#/components/schemas/SecurityDefaultDefinition' },
    guest: { $ref: '#/components/schemas/SecurityGuestDefinition' },
    cron: { $ref: '#/components/schemas/SecurityCronDefinition' },
    roles: {
      type: 'object',
      description: 'This property defines the app roles that are available within the app.',
      minProperties: 1,
      additionalProperties: { $ref: '#/components/schemas/SecurityRoleDefinition' },
    },
  },
};
