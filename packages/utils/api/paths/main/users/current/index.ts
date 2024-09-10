import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';
import { paths as authPaths } from './auth/index.js';
import { paths as emailsPaths } from './emails/index.js';
import { paths as organizationsPaths } from './organizations/index.js';
import { paths as unsubscribePaths } from './unsubscribe.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appsPaths,
  ...authPaths,
  ...emailsPaths,
  ...organizationsPaths,
  ...unsubscribePaths,
  '/api/users/current': {
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
      operationId: 'updateCurrentUser',
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
  },
};
