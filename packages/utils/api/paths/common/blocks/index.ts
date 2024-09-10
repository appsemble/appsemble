import { type OpenAPIV3 } from 'openapi-types';

import { paths as blockIdPaths } from './blockId.js';
import { paths as versionsPaths } from './versions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...blockIdPaths,
  ...versionsPaths,
  '/api/blocks': {
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
};
