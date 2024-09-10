import { type OpenAPIV3 } from 'openapi-types';

import { paths as blocksPaths } from './blocks/index.js';
import { paths as usersPaths } from './users/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...blocksPaths,
  ...usersPaths,
  '/api/main/trainings': {
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
  },
  '/api/main/trainings/{trainingId}': {
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
  },
};
