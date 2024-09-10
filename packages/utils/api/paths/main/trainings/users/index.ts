import { type OpenAPIV3 } from 'openapi-types';

import { paths as currentPaths } from './current.js';

export const paths: OpenAPIV3.PathsObject = {
  ...currentPaths,
  '/api/trainings/{trainingId}/users': {
    parameters: [{ $ref: '#/components/parameters/trainingId' }],
    get: {
      tags: ['main', 'training', 'user'],
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
};
