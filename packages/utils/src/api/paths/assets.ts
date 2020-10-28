import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/assets': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['asset'],
      description: 'Get all of the app’s assets.',
      operationId: 'getAssets',
      responses: {
        200: {
          description: 'The assets associated with the app.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Asset' },
            },
          },
        },
      },
    },
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
              schema: { $ref: '#/components/schemas/Asset' },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/api/apps/{appId}/assets/{assetId}': {
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
    delete: {
      tags: ['asset'],
      description: 'Remove an existing asset',
      operationId: 'deleteAsset',
      responses: {
        204: {
          description: 'The asset was successfully deleted.',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }],
    },
  },
};
