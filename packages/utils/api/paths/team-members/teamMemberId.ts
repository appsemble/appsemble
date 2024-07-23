import { type OpenAPIV3 } from 'openapi-types';

import { teamMemberRoles } from '../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/teamMemberId' }],
  get: {
    tags: ['common', 'team-members'],
    description: 'Get a certain team member from a team',
    operationId: 'getTeamMember',
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
    tags: ['common', 'team-members'],
    description: 'Update the role of a team member.',
    operationId: 'updateTeamMember',
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
                enum: Object.values(teamMemberRoles),
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
    tags: ['common', 'team-members'],
    description: 'Remove a member from a team.',
    operationId: 'removeTeamMember',
    responses: {
      204: {
        description: 'The team member has been removed successfully.',
      },
    },
    security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
  },
};
