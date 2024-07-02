import { type OpenAPIV3 } from 'openapi-types';

import { TeamRole } from '../../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
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
  '/api/apps/{appId}/teams/{teamId}/members/{memberId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'teamId',
        in: 'path',
        description: 'The ID of the team',
        required: true,
        schema: { type: 'number', readOnly: true },
      },
      {
        name: 'memberId',
        in: 'path',
        description: 'The ID of the team member',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['common', 'app', 'team', 'members'],
      description: 'Get a certain team member from a team',
      operationId: 'getAppTeamMember',
      responses: {
        200: {
          description: 'The specified team member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
    },
    put: {
      tags: ['common', 'app', 'team', 'members'],
      description: 'Update the role of a team member.',
      operationId: 'updateAppTeamMember',
      requestBody: {
        description: 'The team to update.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: Object.values(TeamRole),
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
    },
    delete: {
      tags: ['common', 'app', 'team', 'members'],
      description: 'Remove a member from a team.',
      operationId: 'removeAppTeamMember',
      responses: {
        204: {
          description: 'The team member has been removed successfully.',
        },
      },
      security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
    },
  },
};
