import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'training'],
    description: 'Fetch all trainings available',
    operationId: 'getTrainings',
    responses: {
      200: {
        description: 'An array of all the available trainings.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/Training' },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
  post: {
    tags: ['main', 'training'],
    description: '',
    operationId: 'createTraining',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Training',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Created new training successfully',
        $ref: '#/components/schemas/Training',
      },
    },
    security: [{ studio: [] }],
  },
};
