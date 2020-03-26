export default {
  '/apps/{appId}/assets': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
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
              schema: { $ref: '#/components/schemas/Asset/properties/id' },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/apps/{appId}/assets/{assetId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/assetId' },
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
