import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/secrets/service/{serviceSecretId}': {
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
