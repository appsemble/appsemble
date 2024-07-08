import { type OpenAPIV3 } from 'openapi-types';

import { paths as currentPaths } from './current/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...currentPaths,
  '/api/apps/{appId}/members': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app', 'member'],
      description: 'Fetch app accounts by roles.',
      operationId: 'getAppMembersByRoles',
      parameters: [{ $ref: '#/components/parameters/roles' }],
      security: [{ app: [] }],
      responses: {
        200: {
          description: 'The accounts that were fetched.',
        },
      },
    },
  },
  '/api/apps/{appId}/members/email/{memberEmail}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/memberEmail' },
    ],
    delete: {
      tags: ['app', 'member'],
      description: 'Delete an app member by email.',
      operationId: 'deleteAppMemberByEmail',
      security: [{ app: [] }],
      responses: {
        204: {
          description: 'The app member was deleted successfully.',
        },
      },
    },
  },
};
