import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/blocks': {
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
      security: [{ studio: [] }, {}],
    },
  },
  '/api/blocks/@{organizationId}/{blockId}': {
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
  '/api/blocks/@{organizationId}/{blockId}/versions': {
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
  },
  '/api/blocks/@{organizationId}/{blockId}/versions/list': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['block', 'versions'],
      description: 'Retrieve a string list of all versions of a block.',
      operationId: 'getVersionsList',
      responses: {
        200: {
          description: 'String list of all versions of a block.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/blocks/@{organizationId}/{blockId}/versions/{blockVersion}': {
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
    delete: {
      tags: ['block', 'delete'],
      description: 'Delete a single block version.',
      operationId: 'removeBlockVersion',
      responses: {
        204: {
          description: 'Block version has successfully been deleted',
        },
      },
      security: [{ cli: ['blocks:delete'] }],
    },
  },
  '/api/blocks/@{organizationId}/{blockId}/versions/{blockVersion}/asset': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
      {
        name: 'filename',
        in: 'query',
        description: 'The file name of the block asset to download',
        schema: { type: 'string' },
      },
    ],
    get: {
      tags: ['block'],
      description: 'Download a single block asset',
      operationId: 'getBlockAsset',
      responses: {
        200: {
          description: 'The asset that has been requested.',
        },
      },
    },
  },
  '/api/blocks/@{organizationId}/{blockId}/versions/{blockVersion}/messages/{language}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
      { $ref: '#/components/parameters/blockVersion' },
      {
        in: 'path',
        name: 'language',
        schema: { type: 'string' },
        description: 'The language to get messages for.',
        required: true,
      },
    ],
    get: {
      tags: ['block'],
      description: 'Get internationalized messages for a block.',
      operationId: 'getBlockMessages',
      responses: {
        200: {
          description: 'A key/value mapping of block messages.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'A key/value mapping of block messages.',
                additionalProperties: {
                  type: 'string',
                  description: 'A translated block message.',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/blocks/@{organizationId}/{blockId}/versions/{blockVersion}/icon': {
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
        },
      },
    },
  },
};
