import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/variables': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['variable'],
      operationId: 'createAppVariable',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppVariable' },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        201: {
          description: 'The created app variable.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppVariable' },
            },
          },
        },
      },
    },
    get: {
      tags: ['variable'],
      operationId: 'getAppVariables',
      responses: {
        200: {
          description: 'The list of app variables.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppVariable' },
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['variable'],
      operationId: 'deleteAppVariables',
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        204: {
          description: 'The deleted app variables.',
        },
      },
    },
  },
  '/api/apps/{appId}/variables/{appVariableId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appVariableId' },
    ],
    put: {
      tags: ['secret'],
      operationId: 'updateAppVariable',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppVariable' },
          },
        },
      },
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The updated app variable.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppVariable' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['secret'],
      operationId: 'deleteAppVariable',
      security: [{ studio: [] }],
      responses: {
        204: {
          description: 'The deleted app variable.',
        },
      },
    },
  },
};
