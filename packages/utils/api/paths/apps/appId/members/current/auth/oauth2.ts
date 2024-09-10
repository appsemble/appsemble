import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['app', 'member', 'current-member', 'auth', 'oauth2'],
    description: `
        Get the app member information formatted as OpenID user info.

        See https://connect2id.com/products/server/docs/api/userinfo
      `,
    operationId: 'getCurrentAppMemberOAuth2Info',
    security: [{ app: ['openid'] }],
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
              },
            },
          },
        },
      },
    },
  },
};
