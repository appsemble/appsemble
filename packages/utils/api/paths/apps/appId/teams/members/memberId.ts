import { type OpenAPIV3 } from 'openapi-types';

// Import { teamMemberRoles } from '../../../../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
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
  // Get: {
  //   tags: ['common', 'app', 'team', 'members'],
  //   description: 'Get a certain team member from a team',
  //   operationId: 'getAppTeamMember',
  //   responses: {
  //     200: {
  //       description: 'The specified team member',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             $ref: '#/components/schemas/OrganizationMember',
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // put: {
  //   tags: ['common', 'app', 'team', 'members'],
  //   description: 'Update the role of a team member.',
  //   operationId: 'updateAppTeamMember',
  //   requestBody: {
  //     description: 'The team to update.',
  //     required: true,
  //     content: {
  //       'application/json': {
  //         schema: {
  //           type: 'object',
  //           required: ['role'],
  //           properties: {
  //             role: {
  //               type: 'string',
  //               enum: Object.values(teamMemberRoles),
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   responses: {
  //     200: {
  //       description: 'The updated member',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             $ref: '#/components/schemas/OrganizationMember',
  //           },
  //         },
  //       },
  //     },
  //   },
  //   security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
  // },
  // Delete: {
  //   tags: ['common', 'app', 'team', 'members'],
  //   description: 'Remove a member from a team.',
  //   operationId: 'removeAppTeamMember',
  //   responses: {
  //     204: {
  //       description: 'The team member has been removed successfully.',
  //     },
  //   },
  //   security: [{ studio: [] }, { app: [] }, { cli: ['teams:write'] }],
  // },
};
