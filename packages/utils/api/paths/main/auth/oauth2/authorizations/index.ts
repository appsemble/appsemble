import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/auth/oauth2/authorizations/register': {
    post: {
      tags: ['main', 'auth', 'oauth2', 'authorization'],
      operationId: 'registerOAuth2Authorization',
      description: 'asd',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['authorizationUrl', 'code'],
              properties: {
                authorizationUrl: {
                  type: 'string',
                },
                code: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '',
        },
      },
    },
  },
  '/api/auth/oauth2/authorizations/connect': {
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
  },
};
