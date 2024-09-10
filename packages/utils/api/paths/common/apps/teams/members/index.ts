import { type OpenAPIV3 } from 'openapi-types';

import { paths as idPaths } from './memberId.js';

export const paths: OpenAPIV3.PathsObject = {
  ...idPaths,
  '/api/apps/{appId}/teams/{teamId}/members': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'teamId',
        in: 'path',
        description: 'The ID of the team',
        required: true,
        schema: { type: 'number', readOnly: true },
      },
    ],
    get: {
      tags: ['common', 'app', 'team', 'members'],
      description: 'Fetch the members of a team and their roles within the team.',
      operationId: 'getAppTeamMembers',
      responses: {
        200: {
          description: 'The list of all members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrganizationMember',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['teams:read'] }],
    },
    post: {
      tags: ['common', 'app', 'team', 'members'],
      description: 'Add an app member member to a team.',
      operationId: 'addAppTeamMember',
      requestBody: {
        description: 'The team to update.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id'],
              properties: {
                id: { $ref: '#/components/schemas/User/properties/id' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The added member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['teams:write'] }, { cli: ['teams:write'] }],
    },
  },
};
