import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/groupMemberId' },
  ],
  get: {
    tags: ['common', 'group-member'],
    description: 'Get a certain group member from a group',
    operationId: 'getGroupMember',
    responses: {
      200: {
        description: 'The specified group member',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GroupMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: [] }],
  },
  delete: {
    tags: ['common', 'group-member'],
    description: 'Remove a member from a group.',
    operationId: 'deleteGroupMember',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    responses: {
      204: {
        description: 'The group member has been removed successfully.',
      },
    },
    security: [{ studio: [] }, { app: [] }, { cli: ['groups:write'] }],
  },
};
