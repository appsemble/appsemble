import { type OpenAPIV3 } from 'openapi-types';

import { paths as iconPaths } from './icon.js';

export const paths: OpenAPIV3.PathsObject = {
  ...iconPaths,
  '/api/blocks/@{organizationId}/{blockId}/versions/{blockVersion}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
    ],
    get: {
      tags: ['common', 'block', 'version'],
      description: 'Retrieve a single block version.',
      operationId: 'getBlockVersion',
      responses: {
        200: {
          $ref: '#/components/responses/blockVersion',
        },
      },
    },
  },
};
