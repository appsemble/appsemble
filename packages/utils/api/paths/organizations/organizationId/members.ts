import { predefinedOrganizationRoles } from '@appsemble/types';
import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization', 'member'],
    description: 'Get a list of organization members.',
    operationId: 'getOrganizationMembers',
    responses: {
      200: {
        description: 'The list of all members.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['organizations:write'] }],
  },
  post: {
    tags: ['main', 'organization', 'member'],
    description: 'Add an existing account to the organization that matches the given id.',
    operationId: 'addOrganizationMember',
    requestBody: {
      description: 'The account to add.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'role'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
              role: {
                type: 'string',
                enum: predefinedOrganizationRoles,
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'The newly added member.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OrganizationMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['organizations:write'] }],
  },
};
