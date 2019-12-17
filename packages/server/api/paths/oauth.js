export default {
  '/oauth2/client-credentials': {
    post: {
      description: 'Register new OAuth2 client credentials for the authenticated user.',
      tags: ['oauth2'],
      operationId: 'registerOAuth2ClientCredentials',
      requestBody: {
        description: 'The OAuth2 client credentials',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OAuth2ClientCredentials',
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
                $ref: '#/components/schemas/OAuth2ClientCredentials',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    get: {
      description: 'Get a list of client credentials for the authenticated user',
      tags: ['oauth2'],
      operationId: 'listOAuth2ClientCredentials',
      responses: {
        200: {
          description: 'A list of client credentials entities.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OAuth2ClientCredentials',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/oauth2/client-credentials/{clientId}': {
    parameters: [
      {
        name: 'clientId',
        in: 'path',
        description:
          'The client id of the OAuth2 client credentials on which to perform an operation',
        required: true,
        schema: { type: 'string' },
      },
    ],
    delete: {
      description: 'Revoke the client credentials',
      tags: ['oauth2'],
      operationId: 'deleteOAuth2ClientCredentials',
      responses: {
        204: {
          description: 'The client credentials have been revoked succesfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
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
