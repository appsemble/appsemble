import { type OpenAPIV3 } from 'openapi-types';

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
  ],
  // Get: {
  //   tags: ['common', 'app', 'group', 'members'],
  //   description: 'Fetch the members of a group and their roles within the group.',
  //   operationId: 'getAppGroupMembers',
  //   responses: {
  //     200: {
  //       description: 'The list of all members.',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'array',
  //             items: {
  //               $ref: '#/components/schemas/OrganizationMember',
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   security: [{ studio: [] }, { app: ['groups:read'] }],
  // },
  // post: {
  //   tags: ['common', 'app', 'group', 'members'],
  //   description: 'Add an app member member to a group.',
  //   operationId: 'addAppGroupMember',
  //   requestBody: {
  //     description: 'The group to update.',
  //     required: true,
  //     content: {
  //       'application/json': {
  //         schema: {
  //           type: 'object',
  //           required: ['id'],
  //           properties: {
  //             id: { $ref: '#/components/schemas/User/properties/id' },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   responses: {
  //     201: {
  //       description: 'The added member',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             $ref: '#/components/schemas/OrganizationMember',
  //           },
  //         },
  //       },
  //     },
  //   },
  //   security: [{ studio: [] }, { app: ['groups:write'] }, { cli: ['groups:write'] }],
  // },
};
