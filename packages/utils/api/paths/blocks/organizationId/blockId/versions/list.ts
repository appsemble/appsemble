import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/organizationId' },
    { $ref: '#/components/parameters/blockId' },
  ],
  get: {
    tags: ['main', 'block', 'version'],
    description: 'Retrieve a string list of all versions of a block.',
    operationId: 'getBlockVersionsList',
    responses: {
      200: {
        description: 'String list of all versions of a block.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
};
