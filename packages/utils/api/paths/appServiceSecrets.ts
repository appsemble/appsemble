import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/secrets/service': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['secret'],
      operationId: 'addAppServiceSecret',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppServiceSecret' },
          },
        },
      },
      security: [{ studio: [] }],
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
      tags: ['secret'],
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
  },
  '/api/apps/{appId}/secrets/service/{appServiceId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appServiceId' },
    ],
    put: {
      tags: ['secret'],
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
      tags: ['secret'],
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
