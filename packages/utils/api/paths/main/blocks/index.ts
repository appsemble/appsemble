import { type OpenAPIV3 } from 'openapi-types';

import { paths as versionsPaths } from './versions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...versionsPaths,
  '/api/blocks': {
    post: {
      tags: ['main', 'block'],
      description: 'Publish a block.',
      operationId: 'createBlock',
      requestBody: {
        description: 'The new block version to publish.',
        content: {
          'multipart/form-data': {
            schema: {
              $ref: '#/components/schemas/BlockVersion',
            },
          },
        },
      },
      responses: {
        201: {
          $ref: '#/components/responses/blockVersion',
        },
      },
      security: [{ cli: ['blocks:write'] }],
    },
  },
};
