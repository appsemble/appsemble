import { type OpenAPIV3 } from 'openapi-types';

import { paths as appCollectionsPaths } from './app-collections/index.js';
import { paths as appPaths } from './apps/index.js';
import { paths as authPaths } from './auth/index.js';
import { paths as blocksPaths } from './blocks/index.js';
import { paths as containerLogsPaths } from './containerLogs.js';
import { paths as messagesPaths } from './messages/index.js';
import { paths as organizationsPaths } from './organizations/index.js';
import { paths as samlPaths } from './saml/index.js';
import { paths as trainingBlocksPaths } from './training-blocks/index.js';
import { paths as trainingsPaths } from './trainings/index.js';
import { paths as usersPaths } from './users/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appCollectionsPaths,
  ...appPaths,
  ...authPaths,
  ...blocksPaths,
  ...containerLogsPaths,
  ...messagesPaths,
  ...organizationsPaths,
  ...samlPaths,
  ...trainingBlocksPaths,
  ...trainingsPaths,
  ...usersPaths,
  '/api/health': {
    get: {
      tags: ['main'],
      description: 'Check whether or not the API is healthy',
      operationId: 'checkHealth',
      responses: {
        200: {
          description: 'An indication the server is healthy.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Health',
              },
            },
          },
        },
      },
    },
  },
  '/api/ssl': {
    get: {
      tags: ['main'],
      description: 'Check the SSL certificate status for the given domain names.',
      operationId: 'getSslStatus',
      parameters: [
        {
          in: 'query',
          name: 'domains',
          required: true,
          schema: { type: 'array', items: { type: 'string', format: 'hostname' } },
        },
      ],
      responses: {
        200: {
          description: 'A mapping of domain name to their SSL status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: {
                  enum: ['error', 'missing', 'pending', 'ready', 'unknown'],
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/timezones': {
    get: {
      tags: ['main'],
      description: 'Get a list of timezones supported by the API',
      operationId: 'getTimezones',
      responses: {
        200: {
          description: 'A list of timezones supported by the API',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};
