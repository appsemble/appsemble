import { type OpenAPIV3 } from 'openapi-types';

import { paths as versionsPaths } from './versions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...versionsPaths,
  '/api/common/blocks': {
    get: {
      tags: ['common', 'block'],
      description: 'Get all block’s latest definitions.',
      operationId: 'queryBlocks',
      responses: {
        200: {
          description: 'The list of all latest block versions.',
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
  },
  '/api/common/blocks/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['common', 'block'],
      description: 'Get a single block',
      operationId: 'getBlock',
      responses: {
        200: {
          description: 'The latest version of the block that matches the given id.',
          $ref: '#/components/responses/blockVersion',
        },
      },
    },
  },
};
