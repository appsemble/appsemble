import { type OpenAPIV3 } from 'openapi-types';

import { paths as assetsPaths } from './assets/index.js';
import { paths as messagesPaths } from './messages/index.js';
import { paths as versionPaths } from './version/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...assetsPaths,
  ...messagesPaths,
  ...versionPaths,
  '/api/blocks/@{organizationId}/{blockId}/versions': {
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
  },
};
