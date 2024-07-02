import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/assets': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['common', 'app', 'asset'],
      description: 'Get all of the app’s assets.',
      operationId: 'getAppAssets',
      parameters: [
        { $ref: '#/components/parameters/$skip' },
        { $ref: '#/components/parameters/$top' },
      ],
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
      security: [{ studio: [] }, {}],
    },
    post: {
      tags: ['common', 'app', 'asset'],
      description: 'Upload a new asset.',
      operationId: 'createAppAsset',
      requestBody: {
        description: 'The asset to upload.',
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              description: 'The request body for creating an asset.',
              additionalProperties: false,
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  writeOnly: true,
                  description: 'The binary data of the asset. This may include a filename.',
                },
                name: {
                  type: 'string',
                  pattern: normalized.source,
                  description:
                    'The given name of the asset. Assets may be referenced by their name or ID in the API.',
                },
                clonable: {
                  type: 'boolean',
                  description:
                    'Whether the asset should be transferable when cloning the app they are in.',
                },
              },
            },
          },
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
      security: [{ studio: [] }, {}, { cli: ['assets:write'] }],
    },
    delete: {
      tags: ['common', 'app', 'asset'],
      description: 'Delete multiple app assets.',
      operationId: 'deleteAppAssets',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'array',
              description: 'An array of asset IDs to remove.',
              items: { $ref: '#/components/schemas/Asset/properties/id' },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The app assets have been deleted successfully.',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
    },
  },
  '/api/apps/{appId}/assets/\\$count': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['common', 'app', 'asset'],
      description: 'Get the number of assets in the app.',
      operationId: 'countAppAssets',
      responses: {
        200: {
          description: 'The number of assets in the app.',
          content: {
            'application/json': {
              schema: {
                type: 'number',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
    },
  },
  '/api/apps/{appId}/assets/{assetId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/assetId' },
    ],
    get: {
      tags: ['common', 'app', 'asset'],
      description: 'Get a single asset',
      operationId: 'getAppAssetById',
      responses: {
        200: {
          description: 'The asset that matches the given id.',
        },
      },
    },
    head: {
      tags: ['common', 'app', 'asset'],
      description: 'Get the headers for a single asset',
      operationId: 'getAppAssetHeadersById',
      responses: {
        200: {
          description: 'The headers of the asset that matches the given id.',
        },
      },
    },
    delete: {
      tags: ['common', 'app', 'asset'],
      description: 'Remove an existing asset',
      operationId: 'deleteAppAsset',
      responses: {
        204: {
          description: 'The asset was successfully deleted.',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }],
    },
  },
};
