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
    security: [{ studio: [] }],
  },
};
