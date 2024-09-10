import { type OpenAPIV3 } from 'openapi-types';

// Import { groupMemberRoles } from '../../../../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'groupId',
      in: 'path',
      description: 'The ID of the group',
      required: true,
      schema: { type: 'number', readOnly: true },
    },
    {
      name: 'memberId',
      in: 'path',
      description: 'The ID of the group member',
      required: true,
      schema: { $ref: '#/components/schemas/User/properties/id' },
    },
  ],
  // Get: {
  //   tags: ['common', 'app', 'group', 'members'],
  //   description: 'Get a certain group member from a group',
  //   operationId: 'getAppGroupMember',
  //   responses: {
  //     200: {
  //       description: 'The specified group member',
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
  //   tags: ['common', 'app', 'group', 'members'],
  //   description: 'Update the role of a group member.',
  //   operationId: 'updateAppGroupMember',
  //   requestBody: {
  //     description: 'The group to update.',
  //     required: true,
  //     content: {
  //       'application/json': {
  //         schema: {
  //           type: 'object',
  //           required: ['role'],
  //           properties: {
  //             role: {
  //               type: 'string',
  //               enum: Object.values(groupMemberRoles),
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
  //   security: [{ studio: [] }, { app: [] }, { cli: ['groups:write'] }],
  // },
  // Delete: {
  //   tags: ['common', 'app', 'group', 'members'],
  //   description: 'Remove a member from a group.',
  //   operationId: 'removeAppGroupMember',
  //   responses: {
  //     204: {
  //       description: 'The group member has been removed successfully.',
  //     },
  //   },
  //   security: [{ studio: [] }, { app: [] }, { cli: ['groups:write'] }],
  // },
};
