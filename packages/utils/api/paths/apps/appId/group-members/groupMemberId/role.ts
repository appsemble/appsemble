import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/groupMemberId' },
  ],
  put: {
    tags: ['common', 'group-member'],
    description: 'Set the role of a member within a group.',
    operationId: 'updateGroupMemberRole',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    requestBody: {
      description: 'The role to set.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['role'],
            properties: {
              role: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The member’s role has been successfully updated.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GroupMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: [] }, { cli: ['groups:write'] }],
  },
};
