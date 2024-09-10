import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/apps/{appId}/variables': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app', 'variable'],
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
    delete: {
      tags: ['main', 'app', 'variable'],
      operationId: 'deleteAppVariables',
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        204: {
          description: 'The deleted app variables.',
        },
      },
    },
  },
  '/api/main/apps/{appId}/variables/{appVariableId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appVariableId' },
    ],
    put: {
      tags: ['main', 'app', 'variable'],
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
      tags: ['main', 'app', 'variable'],
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
