import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/secrets/ssl': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get the SSL certificate of an app',
      operationId: 'getSSLSecret',
      responses: {
        200: {
          description: 'The SSL secret of the app.',
          $ref: '#/components/schemas/SSLSecret',
        },
      },
      security: [{ studio: [] }],
    },
    put: {
      tags: ['app'],
      description: 'Update the app’s SSL secret',
      operationId: 'updateSSLSecret',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SSLSecret',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated SSL secret.',
          $ref: '#/components/schemas/SSLSecret',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
