import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    description: 'Fetch all completed trainings',
    operationId: 'getCompletedTrainings',
    responses: {
      200: {
        description: 'An array of training IDs that the user has completed',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
