import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization', 'block'],
    description: 'Get a list of an organization’s blocks.',
    operationId: 'getOrganizationBlocks',
    responses: {
      200: {
        description: 'The list of this organization’s blocks.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/BlockVersion',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
};
