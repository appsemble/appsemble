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
