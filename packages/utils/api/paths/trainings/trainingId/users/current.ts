import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/trainingId' }],
  get: {
    tags: ['main', 'training', 'user'],
    description: 'Check if a user is enrolled in a training.',
    operationId: 'isCurrentUserEnrolledInTraining',
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
    tags: ['main', 'training', 'user'],
    description: 'Enroll a user in a training.',
    operationId: 'enrollCurrentUserInTraining',
    responses: { 201: { description: 'Enrolled in the training successfully' } },
    security: [{ studio: [] }],
  },
  patch: {
    tags: ['main', 'training', 'user'],
    description: 'Edit an enrollment of a user in a training',
    operationId: 'setCurrentUserTrainingCompleted',
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
};
