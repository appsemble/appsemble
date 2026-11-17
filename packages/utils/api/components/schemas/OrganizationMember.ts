import { predefinedOrganizationRoles } from '@appsemble/types';
import { type OpenAPIV3 } from 'openapi-types';

export const OrganizationMember: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A member of an organization.',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      $ref: '#/components/schemas/User/properties/id',
    },
    name: {
      $ref: '#/components/schemas/User/properties/name',
    },
    primaryEmail: {
      type: 'string',
      format: 'email',
      description: 'The primary email address of the user.',
    },
    role: {
      description: 'The manual role, or null for group-managed staff.',
      nullable: true,
      enum: predefinedOrganizationRoles,
    },
    roles: {
      description: 'The effective organization roles.',
      type: 'array',
      items: { enum: predefinedOrganizationRoles },
    },
    ssoRoles: {
      description: 'The roles assigned by identity-provider group mappings.',
      type: 'array',
      items: { enum: predefinedOrganizationRoles },
    },
    guest: { type: 'boolean' },
    properties: {
      type: 'object',
      description: 'Additional custom properties that a user might have.',
      additionalProperties: { type: 'string' },
    },
  },
};
