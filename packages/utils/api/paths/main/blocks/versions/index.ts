import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/blocks/@{organizationId}/{blockId}/versions/list': {
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
  },
  '/api/main/blocks/@{organizationId}/{blockId}/versions/{blockVersion}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
    ],
    delete: {
      tags: ['main', 'block', 'version'],
      description: 'Delete a single block version.',
      operationId: 'deleteBlockVersion',
      responses: {
        204: {
          description: 'Block version has successfully been deleted',
        },
      },
      security: [{ cli: ['blocks:delete'] }],
    },
  },
};
