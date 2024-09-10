import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/trainingId' }],
  get: {
    tags: ['main', 'training'],
    description: 'Fetch a single training by id.',
    operationId: 'getTrainingById',
    responses: {
      200: {
        description: 'Object representation of a training',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Training',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
  patch: {
    tags: ['main', 'training'],
    description: 'Fetch a single training by id.',
    operationId: 'patchTraining',
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            description: 'Schema to be used for editing trainings.',
            properties: {
              id: {
                type: 'number',
                readOnly: true,
                minimum: 0,
                description:
                  'The id of the training, will be generated automatically by the system.',
              },
              title: {
                type: 'string',
                description: 'Title of the training.',
              },
              description: {
                type: 'string',
                description: 'A brief overview of the training.',
              },
              competence: {
                type: 'string',
                description: 'Competence tags for the training',
              },
              difficultyLevel: {
                type: 'number',
                description: 'Difficulty level between 1 and 5',
                minimum: 1,
                maximum: 5,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Object representation of a training',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Training',
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  delete: {
    tags: ['main', 'training'],
    description: 'Delete a training by Id.',
    operationId: 'deleteTraining',
    responses: {
      204: { description: 'Deleted the specified training.' },
    },
    security: [{ studio: [] }],
  },
};
