export default {
  '/api/oauth/register': {
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
  '/api/oauth/connect': {
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
