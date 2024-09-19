import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'user', 'current-user'],
    description: "Fetch the logged in user's profile.",
    operationId: 'getCurrentUser',
    responses: {
      200: {
        description: "The user's profile.",
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  put: {
    tags: ['main', 'user', 'current-user'],
    description: "Update the logged in user's profile.",
    operationId: 'patchCurrentUser',
    requestBody: {
      required: true,
      $ref: '#/components/requestBodies/user',
    },
    responses: {
      200: {
        description: "The user's profile.",
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
