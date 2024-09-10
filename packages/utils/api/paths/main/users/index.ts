import { type OpenAPIV3 } from 'openapi-types';

import { paths as currentPaths } from './current/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...currentPaths,
  '/api/main/users/subscribed': {
    get: {
      tags: ['main', 'user'],
      description: 'Get a list of active and verified users subscribed to the appsemble newsletter',
      operationId: 'getSubscribedUsers',
      responses: {
        200: { description: 'List of subscribed users' },
        401: { description: 'Invalid or missing admin API secret' },
      },
    },
  },
};
