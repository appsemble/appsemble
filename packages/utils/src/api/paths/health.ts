import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/health': {
    get: {
      tags: ['health'],
      description: 'Check whether or not the API is healthy',
      operationId: 'checkHealth',
      responses: {
        200: {
          description: 'An indication the server is healthy.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Health',
              },
            },
          },
        },
      },
    },
  },
};
