export default {
  '/oauth2/connect/register': {
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
  '/oauth2/connect/pending': {
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
              required: ['code', 'authorizationUrl'],
              properties: {
                code: {
                  type: 'string',
                },
                authorizationUrl: {
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
  '/oauth2/authorization-code': {
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
