import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/secrets/saml': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['secret'],
      operationId: 'createAppSamlSecret',
      requestBody: {
        content: {
          'application/json': {
            schema: {},
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        201: {
          description: 'A list of the SAML secrets for the app.',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    },
    get: {
      tags: ['secret'],
      operationId: 'getAppSamlSecrets',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A list of the SAML secrets for the app.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {},
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['secret'],
      operationId: 'deleteAppSamlSecrets',
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        204: {
          description: 'The deleted app saml secrets.',
        },
      },
    },
  },
  '/api/apps/{appId}/secrets/saml/{appSamlSecretId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    put: {
      tags: ['secret'],
      operationId: 'updateAppSamlSecret',
      requestBody: {
        content: {
          'application/json': {
            schema: {},
          },
        },
      },
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The updated SAML secret.',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    },
    delete: {
      tags: ['secret'],
      operationId: 'deleteAppSamlSecret',
      security: [{ studio: [] }],
      responses: {
        204: {
          description: 'The deleted SAML secret.',
        },
      },
    },
  },
};
