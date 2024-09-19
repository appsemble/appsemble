import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/trainingId' }],
  get: {
    tags: ['main', 'training', 'training-block'],
    description: 'Fetch all training blocks by training id',
    operationId: 'getTrainingBlocksByTrainingId',
    responses: {
      200: {
        description: 'An array of all the training Blocks associated with a training.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/TrainingBlock' },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
  post: {
    tags: ['main', 'training', 'training-block'],
    description: 'Create a new training block as a child of a training.',
    operationId: 'createTrainingBlock',
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              documentationLink: {
                $ref: '#/components/schemas/TrainingBlock/properties/documentationLink',
              },
              videoLink: { $ref: '#/components/schemas/TrainingBlock/properties/videoLink' },
              exampleCode: { $ref: '#/components/schemas/TrainingBlock/properties/exampleCode' },
              title: { $ref: '#/components/schemas/TrainingBlock/properties/title' },
              externalResource: {
                $ref: '#/components/schemas/TrainingBlock/properties/externalResource',
              },
            },
          },
        },
      },
    },
    responses: { 201: { description: 'Created new training block successfully' } },
    security: [{ studio: [] }],
  },
};
