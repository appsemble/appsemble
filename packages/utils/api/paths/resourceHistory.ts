import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/resources/{resourceType}/{resourceId}/history': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
      { $ref: '#/components/parameters/resourceId' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get the known history of a resource',
      operationId: 'getResourceHistory',
      responses: {
        200: {
          description: 'The resource that matches the given id.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/responses/resource',
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
