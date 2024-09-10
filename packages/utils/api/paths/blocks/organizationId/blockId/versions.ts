import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
  ],
  get: {
    tags: ['common', 'block', 'version'],
    description: 'Retrieves all available versions of a block.',
    operationId: 'getBlockVersions',
    responses: {
      200: {
        description: 'A list of versions of a block.',
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
  },
};
