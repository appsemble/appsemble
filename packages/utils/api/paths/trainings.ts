import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/trainings': {
    get: {
      tags: ['training', 'learning', 'docs'],
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
      security: [{ studio: [] }],
    },
    post: {
      tags: ['training', 'learning', 'docs'],
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
  },
  '/api/trainings/{trainingId}': {
    parameters: [{ $ref: '#/components/parameters/trainingId' }],
    get: {
      tags: ['training', 'learning', 'docs'],
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
      security: [{ studio: [] }],
    },
    patch: {
      tags: ['training', 'learning', 'docs'],
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
      tags: ['delete', 'training'],
      description: 'Delete a training by Id.',
      operationId: 'deleteTraining',
      responses: {
        204: { description: 'Deleted the specified training.' },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/trainings/{trainingId}/blocks': {
    parameters: [{ $ref: '#/components/parameters/trainingId' }],
    get: {
      tags: ['training', 'trainingBlocks', 'learning', 'docs'],
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
      security: [{ studio: [] }],
    },
    post: {
      tags: ['training', 'trainingBlocks', 'learning', 'docs'],
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
  },
  '/api/trainings/{trainingId}/enroll/users': {
    parameters: [{ $ref: '#/components/parameters/trainingId' }],
    get: {
      tags: ['training', 'users', 'enrolled'],
      description: 'Get a list of all users who have completed a training.',
      operationId: 'getTrainedUsers',
      responses: {
        200: {
          description: 'A list of all the users who have completed a training.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/trainings/{trainingId}/enroll': {
    parameters: [{ $ref: '#/components/parameters/trainingId' }],
    get: {
      tags: ['training', 'learning', 'user'],
      description: 'Check if a user is enrolled in a training.',
      operationId: 'isUserEnrolled',
      responses: {
        200: {
          description: 'A boolean returning whether a user is enrolled in a training',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  enrolled: {
                    type: 'boolean',
                    description: 'If a user is enrolled in a training',
                  },
                  completed: {
                    type: 'boolean',
                    description: 'If the training has been completed by the user.',
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    post: {
      tags: ['training', 'learning', 'user'],
      description: 'Enroll a user in a training.',
      operationId: 'enrollUserInTraining',
      responses: { 201: { description: 'Enrolled in the training successfully' } },
      security: [{ studio: [] }],
    },
    patch: {
      tags: ['training', 'learning', 'user'],
      description: 'Edit an enrollment of a user in a training',
      operationId: 'updateTrainingCompletionStatus',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                completed: {
                  type: 'boolean',
                  description: 'If the training has been completed by the user.',
                },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated user training successfully.' } },
      security: [{ studio: [] }],
    },
  },
  '/api/training/blocks/{trainingBlockId}': {
    parameters: [{ $ref: '#/components/parameters/trainingBlockId' }],
    patch: {
      tags: ['training', 'trainingBlocks', 'learning', 'docs'],
      description: 'Update a training block with new content',
      operationId: 'patchTrainingBlock',
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
      responses: { 200: { $ref: '#/components/schemas/TrainingBlock' } },
      security: [{ studio: [] }],
    },
    delete: {
      tags: ['delete', 'training'],
      description: 'Delete a training block by Id.',
      operationId: 'deleteTrainingBlock',
      responses: {
        204: { description: 'Deleted the specified training block.' },
      },
      security: [{ studio: [] }],
    },
  },
};
