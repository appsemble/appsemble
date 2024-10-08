import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app', 'secret', 'ssl'],
    description: 'Get the SSL certificate of an app',
    operationId: 'getAppSslSecret',
    responses: {
      200: {
        description: 'The SSL secret of the app.',
        $ref: '#/components/schemas/SSLSecret',
      },
    },
    security: [{ studio: [] }],
  },
  put: {
    tags: ['main', 'app', 'secret', 'ssl'],
    description: 'Update the app’s SSL secret',
    operationId: 'updateAppSslSecret',
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
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
};
