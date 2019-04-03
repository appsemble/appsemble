export default {
  '/api/assets': {
    post: {
      tags: ['asset'],
      description: 'Upload a new asset.',
      operationId: 'createAsset',
      requestBody: {
        description: 'The asset to upload.',
        content: {
          '*/*': {},
        },
      },
      responses: {
        201: {
          description: 'The asset that was created.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'The asset id.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/assets/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'The id of the asset to get.',
        schema: { type: 'integer' },
      },
    ],
    get: {
      tags: ['asset'],
      description: 'Get a single asset',
      operationId: 'getAssetById',
      responses: {
        200: {
          description: 'The asset that matches the given id.',
        },
      },
    },
  },
};
