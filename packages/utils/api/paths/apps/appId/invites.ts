import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['app', 'invite'],
    description: 'Get a list of invited app members.',
    operationId: 'getAppInvites',
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
    tags: ['app', 'invite'],
    description: 'Invite a new app member to an app.',
    operationId: 'createAppInvites',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    requestBody: {
      description: 'The invite to create.',
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
    security: [{ studio: [] }, { app: ['app:write'] }],
  },
};
