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
  post: {
    tags: ['app', 'group', 'invite'],
    description: 'Invite a new user to a group.',
    operationId: 'createGroupInvite',
    requestBody: {
      description: 'The group invite to create.',
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
                description: 'The email address of the user to invite.',
              },
              role: {
                type: 'string',
                enum: ['member', 'manager'],
                description: 'The role to invite the user as.',
                default: 'member',
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
    security: [{ app: ['groups:write'] }],
  },
};
