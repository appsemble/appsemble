export default {
  '/api/blocks': {
    post: {
      tags: ['block'],
      description: 'Register a new block.',
      operationId: 'createBlockDefinition',
      requestBody: {
        description: 'The block definition to create.',
        $ref: '#/components/requestBodies/blockDefinition',
      },
      responses: {
        201: {
          $ref: '#/components/responses/blockDefinition',
        },
      },
    },
    get: {
      tags: ['block'],
      description: 'Get all existing block definitions.',
      operationId: 'queryBlockDefinitions',
      responses: {
        200: {
          description: 'The list of all block definitions.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BlockDefinition',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/blocks/{organization}/{id}': {
    parameters: [
      {
        name: 'organization',
        in: 'path',
        description: 'The organization of the block definition.',
      },
      {
        name: 'id',
        in: 'path',
        description: 'The id of the block definition.',
      },
    ],
    get: {
      tags: ['block'],
      description: 'Get a single block',
      operationId: 'getBlockDefinition',
      responses: {
        200: {
          description: 'The app that matches the given id.',
          $ref: '#/components/responses/blockDefinition',
        },
      },
    },
  },
  '/api/blocks/{organization}/{id}/versions': {
    parameters: [
      {
        name: 'organization',
        in: 'path',
        description: 'The organization of the block definition.',
      },
      {
        name: 'id',
        in: 'path',
        description: 'The id of the block definition.',
      },
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
    },
  },
  '/api/blocks/{organization}/{id}/versions/{version}': {
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
  '/api/blocks/{organization}/{id}/versions/{version}/{path}': {
    parameters: [
      {
        name: 'organization',
        in: 'path',
        description: 'The organization of the block definition.',
      },
      {
        name: 'id',
        in: 'path',
        description: 'The id of the block definition.',
      },
      {
        name: 'version',
        in: 'path',
        description: 'The block version as a semantic version.',
      },
      {
        name: 'path',
        in: 'path',
        description: 'The path segments of the asset to get.',
        schema: { type: 'array' },
      },
    ],
    get: {
      tags: ['block version'],
      description: 'Get an asset of a block version.',
      operationId: 'getBlockAsset',
      responses: {
        200: {
          description: 'The Block asset.',
        },
      },
    },
  },
};
