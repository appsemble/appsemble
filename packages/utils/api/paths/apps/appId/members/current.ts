import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['app', 'member', 'current-member'],
    description: `
      Get the app member information formatted as OpenID user info.

      See https://connect2id.com/products/server/docs/api/userinfo
    `,
    operationId: 'getCurrentAppMember',
    security: [{ app: ['openid'] }],
    responses: {
      200: {
        description: 'OpenID compatible app member information',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                sub: {
                  type: 'string',
                  description: 'The subject (end-user) identifier. ',
                },
                name: {
                  type: 'string',
                  description: 'The full name of the end-user',
                },
                picture: {
                  type: 'string',
                  format: 'url',
                  description: 'The URL of the profile page for the end-user.',
                },
                profile: {
                  type: 'string',
                  format: 'url',
                  description: 'The URL to the app member profile.',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The end-user’s preferred email address.',
                },
                email_verified: {
                  type: 'boolean',
                  description:
                    'True if the end-user’s email address has been verified, else false.',
                },
                properties: {
                  type: 'object',
                  description: 'Custom app member properties.',
                },
                phoneNumber: {
                  type: 'string',
                  description: 'Phone number',
                },
              },
            },
          },
        },
      },
    },
  },
  patch: {
    description: 'Update the data of the currently logged in app member',
    tags: ['app', 'member'],
    operationId: 'patchCurrentAppMember',
    security: [{ studio: [] }, { app: [] }],
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
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'The member’s custom properties.',
              },
              locale: {
                type: 'string',
                description: 'The preferred locale of the user.',
              },
              phoneNumber: {
                type: 'string',
                description: 'Phone number',
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
        description: 'The patched app member',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppMember',
            },
          },
        },
      },
    },
  },
};
