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
                  roles: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
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
              required: ['email', 'roles'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The email address of the user to invite.',
                },
                roles: {
                  type: 'array',
                  description: 'The direct roles to invite the user as.',
                  items: {
                    type: 'string',
                  },
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  roles: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['app:write'] }],
  },
  delete: {
    tags: ['app', 'invite'],
    description: 'Revoke an app member invitation.',
    operationId: 'deleteAppInvite',
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
