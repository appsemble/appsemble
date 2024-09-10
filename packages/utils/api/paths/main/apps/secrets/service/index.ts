import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/apps/{appId}/secrets/service': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app', 'secret', 'service'],
      operationId: 'createAppServiceSecret',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppServiceSecret' },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        201: {
          description: 'The created app service secret.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppServiceSecret' },
            },
          },
        },
      },
    },
    get: {
      tags: ['main', 'app', 'secret', 'service'],
      operationId: 'getAppServiceSecrets',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The list of app service secrets.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppServiceSecret' },
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'secret', 'service'],
      operationId: 'deleteAppServiceSecrets',
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        204: {
          description: 'The deleted app service secrets.',
        },
      },
    },
  },
  '/api/main/apps/{appId}/secrets/service/{serviceSecretId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/serviceSecretId' },
    ],
    put: {
      tags: ['main', 'app', 'secret', 'service'],
      operationId: 'updateAppServiceSecret',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppServiceSecret' },
          },
        },
      },
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The updated app service secret.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppServiceSecret' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'secret', 'service'],
      operationId: 'deleteAppServiceSecret',
      security: [{ studio: [] }],
      responses: {
        204: {
          description: 'The deleted app service secret.',
        },
      },
    },
  },
};
