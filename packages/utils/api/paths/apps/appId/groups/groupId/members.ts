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
  get: {
    tags: ['common', 'app', 'group', 'members'],
    description: 'Fetch the members of a group and their roles within the group.',
    operationId: 'getGroupMembers',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    responses: {
      200: {
        description: 'The list of all members.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/GroupMember',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['groups:read'] }],
  },
  post: {
    tags: ['app', 'group', 'members'],
    description: 'Add an app member to a group',
    operationId: 'addAppMemberToGroup',
    responses: {
      200: {
        description: 'The created group member',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GroupMember',
            },
          },
        },
      },
    },
    requestBody: {
      description: 'Add an app member to a group',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['id', 'role'],
            properties: {
              id: {
                $ref: '#/components/schemas/AppMember/properties/id',
                description: 'The id of the user to add.',
              },
              role: {
                type: 'string',
                description: 'The role to invite the user as.',
              },
            },
          },
        },
      },
    },
    security: [{ app: ['groups:read'] }],
  },
};
