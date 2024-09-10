import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main'],
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
};
