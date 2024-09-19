import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
