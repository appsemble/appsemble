export default {
  '/oauth2/connect/pending': {
    get: {
      parameters: [
        {
          name: 'provider',
          required: true,
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'code',
          required: true,
          in: 'query',
          schema: { type: 'string' },
        },
      ],
      description: 'Get an OAuth2 profile which is pending connection to an Appsemble account',
      tags: ['oauth2'],
      operationId: 'getPendingOAuth2Profile',
      responses: {
        200: {
          description: 'The profile which is pending connection.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
      },
    },
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
              required: ['code', 'provider'],
              properties: {
                code: {
                  type: 'string',
                },
                provider: {
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
  '/oauth/register': {
    post: {
      description: 'Register a new account using OAuth2 credentials',
      operationId: 'registerOAuth',
      requestBody: {
        description: 'OAuth credentials',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'accessToken', 'refreshToken', 'provider'],
              properties: {
                id: {
                  type: 'string',
                },
                accessToken: {
                  type: 'string',
                },
                refreshToken: {
                  type: 'string',
                },
                provider: {
                  type: 'string',
                },
                organization: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created account.',
        },
      },
    },
  },
  '/oauth/connect': {
    post: {
      description: 'Connect an existing account with new OAuth2 credentials',
      operationId: 'connectOAuth',
      requestBody: {
        description: 'OAuth2 credentials',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'accessToken', 'refreshToken', 'provider', 'userId'],
              properties: {
                id: {
                  type: 'string',
                },
                userId: {
                  type: 'number',
                },
                accessToken: {
                  type: 'string',
                },
                refreshToken: {
                  type: 'string',
                },
                provider: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Credentials have been successfully connected.',
        },
      },
    },
  },
};
