import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    description: 'Fetch all training ids stored on the server',
    operationId: 'getTrainingIds',
    responses: {
      200: {
        description: "An array of all training Id's",
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
  },
};
