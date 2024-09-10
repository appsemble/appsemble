import { type OpenAPIV3 } from 'openapi-types';

import { paths as assetsPaths } from './assets/index.js';
import { paths as messagesPaths } from './messages/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...assetsPaths,
  ...messagesPaths,
  '/api/common/blocks/@{organizationId}/{blockId}/versions': {
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
  '/api/common/blocks/@{organizationId}/{blockId}/versions/{blockVersion}': {
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
  '/api/common/blocks/@{organizationId}/{blockId}/versions/{blockVersion}/icon': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
    ],
    get: {
      tags: ['common', 'block', 'version'],
      description: 'Get the icon of a block version.',
      operationId: 'getBlockVersionIcon',
      responses: {
        200: {
          description: 'The icon that represents the block.',
        },
      },
    },
  },
};
