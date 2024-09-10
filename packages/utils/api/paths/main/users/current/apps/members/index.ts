import { type OpenAPIV3 } from 'openapi-types';

import { paths as memberPaths } from './member.js';

export const paths: OpenAPIV3.PathsObject = {
  ...memberPaths,
  '/api/users/current/apps/members': {
    get: {
      description: 'Get the accounts that have been linked to an app and the user',
      tags: ['main', 'user', 'current-user', 'app', 'member'],
      operationId: 'getCurrentUserAppMembers',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A list of linked accounts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/AppAccount',
                },
              },
            },
          },
        },
      },
    },
  },
};
