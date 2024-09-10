import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/apps/{appId}/screenshots': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app', 'screenshot'],
      description: 'Add one or multiple screenshots of an app.',
      operationId: 'createAppScreenshot',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                screenshots: {
                  type: 'array',
                  description: 'Screenshots to showcase in the store',
                  minItems: 1,
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
                language: {
                  type: 'string',
                  description: 'The language for which the screenshots will be uploaded',
                },
              },
            },
            encoding: {
              screenshots: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The screenshots have been successfully created.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'integer',
                  description: 'The ID of the newly created screenshot.',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/main/apps/{appId}/screenshots/{screenshotId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/screenshotId' },
    ],
    get: {
      tags: ['main', 'app', 'screenshot'],
      description: 'Get a screenshot of an app.',
      operationId: 'getAppScreenshot',
      responses: {
        200: {
          description: 'The app screenshot',
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'screenshot'],
      description: 'Delete an existing screenshot.',
      operationId: 'deleteAppScreenshot',
      responses: {
        200: {
          description: 'The screenshot has been successfully deleted.',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
