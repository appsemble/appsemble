import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/apps/{appId}/secrets/oauth2': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'createAppOAuth2Secret',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        201: {
          description: 'A list of the OAuth2 secrets for the app.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
            },
          },
        },
      },
    },
    get: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'getAppOAuth2Secrets',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A list of the OAuth2 secrets for the app.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppOAuth2Secret' },
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'deleteAppOAuth2Secrets',
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        204: {
          description: 'The deleted app OAuth2 secrets.',
        },
      },
    },
  },
  '/api/main/apps/{appId}/secrets/oauth2/{appOAuth2SecretId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appOAuth2SecretId' },
    ],
    get: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'getAppOAuth2Secret',
      responses: {
        200: {
          description: `
            Get a partial app OAuth2 secret

            Only public facing values are output on this endpoint.
          `,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppOAuth2Secret' },
              },
            },
          },
        },
      },
    },
    put: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'updateAppOAuth2Secret',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
          },
        },
      },
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The updated OAuth2 secret.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'deleteAppOAuth2Secret',
      security: [{ studio: [] }],
      responses: {
        204: {
          description: 'The deleted OAuth2 secret.',
        },
      },
    },
  },
  '/api/main/apps/{appId}/secrets/oauth2/{appOAuth2SecretId}/verify': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appOAuth2SecretId' },
    ],
    post: {
      tags: ['main', 'app', 'secret', 'oauth2'],
      operationId: 'verifyAppOAuth2SecretCode',
      security: [{ studio: [] }, {}],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'scope', 'redirectUri', 'timezone'],
              properties: {
                code: { type: 'string' },
                scope: { type: 'string' },
                redirectUri: { type: 'string' },
                timezone: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: `
            Get a partial app OAuth2 secret

            Only public facing values are output on this endpoint.
          `,
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
    },
  },
};
