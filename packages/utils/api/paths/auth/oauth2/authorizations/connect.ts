import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    description: 'Create an account using an OAuth2 authorization.',
    tags: ['main', 'auth', 'oauth2', 'authorization'],
    operationId: 'connectOAuth2Authorization',
    requestBody: {
      description: 'The OAuth2 client credentials',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['code', 'authorizationUrl', 'timezone'],
            properties: {
              code: {
                type: 'string',
              },
              authorizationUrl: {
                type: 'string',
              },
              timezone: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'An access token response.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
};
