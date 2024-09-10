import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/users/current/apps/members': {
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
  '/api/main/users/current/apps/{appId}/member': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      description: 'Get a single account that has been linked to an app and the current user',
      tags: ['main', 'user', 'current-user', 'app', 'member'],
      operationId: 'getCurrentUserAppMember',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A linked account',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppAccount',
              },
            },
          },
        },
      },
    },
  },
};
