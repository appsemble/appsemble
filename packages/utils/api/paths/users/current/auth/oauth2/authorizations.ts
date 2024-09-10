import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    description: 'Get a list of the current user’s OAuth2 authorizations.',
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2', 'authorization'],
    operationId: 'getCurrentUserOAuth2Authorizations',
    responses: {
      200: {
        description: 'An access token response.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  authorizationUrl: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  delete: {
    description: 'Unlink a linked account from the logged in user.',
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2', 'authorization'],
    operationId: 'deleteCurrentUserOAuth2Authorization',
    parameters: [
      { in: 'query', name: 'authorizationUrl', required: true, schema: { type: 'string' } },
    ],
    responses: {
      201: {
        description: 'The account was unlinked successfully.',
      },
    },
    security: [{ studio: [] }],
  },
};
