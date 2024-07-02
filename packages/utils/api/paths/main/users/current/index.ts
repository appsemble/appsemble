import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';
import { paths as authPaths } from './auth/index.js';
import { paths as emailsPaths } from './emails/index.js';
import { paths as organizationsPaths } from './organizations/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appsPaths,
  ...authPaths,
  ...emailsPaths,
  ...organizationsPaths,
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
  '/api/users/current/unsubscribe': {
    post: {
      tags: ['main', 'user', 'current-user'],
      description: 'Unsubscribe a user from the newsletter',
      operationId: 'unsubscribeCurrentUser',
      responses: {
        201: { description: 'Unsubscribed successfully' },
        401: { description: 'Invalid or missing admin API secret' },
      },
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                },
              },
            },
          },
        },
      },
    },
  },
};
