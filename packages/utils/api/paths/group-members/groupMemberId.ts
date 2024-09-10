import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/groupMemberId' }],
  get: {
    tags: ['common', 'group-members'],
    description: 'Get a certain group member from a group',
    operationId: 'getGroupMember',
    responses: {
      200: {
        description: 'The specified group member',
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
  delete: {
    tags: ['common', 'group-members'],
    description: 'Remove a member from a group.',
    operationId: 'removeGroupMember',
    responses: {
      204: {
        description: 'The group member has been removed successfully.',
      },
    },
    security: [{ studio: [] }, { app: [] }, { cli: ['groups:write'] }],
  },
};
