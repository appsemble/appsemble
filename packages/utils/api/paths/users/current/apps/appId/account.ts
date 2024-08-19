import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    description: 'Get the account that have been linked to the app and the user',
    tags: ['main', 'user', 'current-user', 'app', 'account'],
    operationId: 'getCurrentUserAppAccount',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'A linked account',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppAccount',
            },
          },
        },
      },
    },
  },
  patch: {
    description: 'Get the account that have been linked to the app and the user',
    tags: ['main', 'user', 'current-user', 'app', 'account'],
    operationId: 'patchCurrentUserAppAccount',
    security: [{ studio: [] }],
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: {
                type: 'string',
              },
              picture: {
                type: 'string',
                format: 'binary',
                description: 'The member’s profile picture.',
              },
            },
          },
          encoding: {
            picture: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'A linked account',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppAccount',
            },
          },
        },
      },
    },
  },
};
