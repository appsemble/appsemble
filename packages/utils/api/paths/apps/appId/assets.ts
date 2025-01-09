import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'asset'],
    description: 'Get all of the app’s assets.',
    operationId: 'queryAppAssets',
    parameters: [
      { $ref: '#/components/parameters/$skip' },
      { $ref: '#/components/parameters/$top' },
      { $ref: '#/components/parameters/seed' },
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
    parameters: [{ $ref: '#/components/parameters/seed' }],
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
                properties: {
                  path: { type: 'string' },
                  mimeType: { type: 'string' },
                  filename: { type: 'string' },
                },
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
    security: [{ studio: [] }, { cli: ['assets:write'] }, {}],
  },
  delete: {
    tags: ['common', 'app', 'asset'],
    description: 'Delete multiple app assets.',
    operationId: 'deleteAppAssets',
    parameters: [{ $ref: '#/components/parameters/seed' }],
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
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['assets:write'] }, {}],
  },
};
