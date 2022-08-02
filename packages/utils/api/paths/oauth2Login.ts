import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/oauth2/connect/register': {
    post: {
      operationId: 'registerOAuth2Connection',
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
  '/api/oauth2/connect/pending': {
    post: {
      description: 'Create an account using an OAuth2 authorization.',
      tags: ['oauth2'],
      operationId: 'connectPendingOAuth2Profile',
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
  '/api/oauth2/connected': {
    get: {
      description: 'Get a list of the user’s connected OAuth2 accounts.',
      tags: ['oauth2'],
      operationId: 'getConnectedAccounts',
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
      tags: ['oauth2'],
      operationId: 'unlinkConnectedAccount',
      parameters: [
        { in: 'query', name: 'authorizationUrl', required: true, schema: { type: 'string' } },
      ],
      responses: {
        204: {
          description: 'The account was unlinked successfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
