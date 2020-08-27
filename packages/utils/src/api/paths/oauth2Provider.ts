import type { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/connect/userinfo': {
    get: {
      tags: ['openid', 'user'],
      description: `
        Get the user information formatted as OpenID user info.

        See https://connect2id.com/products/server/docs/api/userinfo
      `,
      operationId: 'getUserInfo',
      security: [{ studio: [] }, { app: ['openid'] }],
      responses: {
        200: {
          description: 'OpenID compatible user information',
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
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/oauth2/authorization-code': {
    post: {
      description: 'XXX',
      tags: ['oauth2'],
      operationId: 'createAuthorizationCode',
      requestBody: {
        description: 'The OAuth2 client credentials',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                appId: { type: 'number' },
                redirectUri: { type: 'string', format: 'uri' },
                scope: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The newly created client credentials',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
};
