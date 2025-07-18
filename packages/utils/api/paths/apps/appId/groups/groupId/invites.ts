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
    tags: ['group', 'invite'],
    description: 'Get a list of invited group members.',
    operationId: 'getGroupInvites',
    responses: {
      200: {
        description: 'The list of all invites.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  role: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  post: {
    tags: ['group', 'invite'],
    description: 'Invite a new user to a group.',
    operationId: 'createGroupInvites',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    requestBody: {
      description: 'The group invite to create.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              required: ['email', 'role'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The email address of the user to invite.',
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
    },
    responses: {
      200: {
        description: 'The invited member',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppMember',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['groups:write'] }, { cli: ['groups:write'] }],
  },
  delete: {
    tags: ['group', 'invite'],
    description: 'Revoke a group member invitation.',
    operationId: 'deleteGroupInvite',
    requestBody: {
      description: 'The email address to revoke the invite of.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: 'The invitation has been successfully revoked.',
      },
    },
    security: [{ studio: [] }],
  },
};
