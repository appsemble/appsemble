import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/assets': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app', 'asset'],
      description: 'Upload a new seed asset.',
      operationId: 'createAppSeedAsset',
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
      tags: ['main', 'app', 'asset'],
      description: 'Delete all app seed assets.',
      operationId: 'deleteAppSeedAssets',
      responses: {
        204: {
          description: 'The app assets have been deleted successfully.',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
    },
  },
};
