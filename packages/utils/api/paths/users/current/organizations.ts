import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'user', 'current-user', 'organization'],
    description: "Fetch the logged in user's organizations.",
    operationId: 'getCurrentUserOrganizations',
    responses: {
      200: {
        description: 'The organizations the logged in user is a member of.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { $ref: '#/components/schemas/Organization/properties/id' },
                  name: { $ref: '#/components/schemas/Organization/properties/name' },
                  role: { $ref: '#/components/schemas/OrganizationMember/properties/role' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
