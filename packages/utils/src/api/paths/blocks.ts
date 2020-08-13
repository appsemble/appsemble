import type { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/blocks': {
    post: {
      tags: ['block version'],
      description: 'Publish a block.',
      operationId: 'publishBlock',
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
    get: {
      tags: ['block'],
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
    },
  },
  '/blocks/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['block'],
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
  '/blocks/@{organizationId}/{blockId}/versions': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['block version'],
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
    post: {
      tags: ['block version'],
      description: 'Publish a version of a block definition',
      operationId: 'createBlockVersion',
      requestBody: {
        description: 'The new block version to publish.',
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['data'],
              properties: {
                data: {
                  $ref: '#/components/schemas/BlockVersion',
                },
              },
              additionalProperties: {
                type: 'string',
                format: 'binary',
              },
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
  '/blocks/@{organizationId}/{blockId}/versions/{blockVersion}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
    ],
    get: {
      tags: ['block'],
      description: 'Retrieve a single block version.',
      operationId: 'getBlockVersion',
      responses: {
        200: {
          $ref: '#/components/responses/blockVersion',
        },
      },
    },
  },
  '/blocks/@{organizationId}/{blockId}/versions/{blockVersion}/icon': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
    ],
    get: {
      tags: ['block'],
      description: 'Get the icon of a block version.',
      operationId: 'getBlockIcon',
      responses: {
        200: {
          description: 'The icon that represents the block.',
          // $ref: '#/components/responses/blockVersion',
        },
      },
    },
  },
};
