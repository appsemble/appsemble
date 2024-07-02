import { type OpenAPIV3 } from 'openapi-types';

import { roles } from '../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations/{organizationId}/invites': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['main', 'organization', 'invite'],
      description: 'Get a list of invited organization members.',
      operationId: 'getOrganizationInvites',
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
                      enum: Object.keys(roles),
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
      tags: ['main', 'organization', 'invite'],
      description: 'Invite a new member to the organization that matches the given id.',
      operationId: 'createOrganizationInvites',
      requestBody: {
        description: 'The member to invite.',
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
                  },
                  role: {
                    type: 'string',
                    enum: Object.keys(roles),
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The newly invited member.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    delete: {
      tags: ['main', 'organization', 'invite'],
      description: 'Revoke a member invitation.',
      operationId: 'deleteOrganizationInvite',
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
  },
  '/api/organizations/{organizationId}/invites/resend': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    post: {
      tags: ['organization'],
      description: 'Request to resend an invitation.',
      operationId: 'resendOrganizationInvite',
      requestBody: {
        description: 'The email of the person to resend the invitation to.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The invite has been sent.',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/organizations/{organizationId}/invites/{inviteToken}': {
    parameters: [
      {
        name: 'token',
        in: 'path',
        description: 'The token of the invite.',
        required: true,
        schema: { type: 'string' },
      },
    ],
    get: {
      tags: ['main', 'organization', 'invite'],
      description: 'Fetch information about an invite.',
      operationId: 'getOrganizationInvite',
      responses: {
        200: {
          description: 'An invite response',
          $ref: '#/components/responses/invite',
        },
      },
    },
  },
  '/api/organizations/{organizationId}/invites/{inviteToken}/respond': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      {
        name: 'inviteToken',
        in: 'path',
        description: 'The token of the invite.',
        required: true,
        schema: { type: 'string' },
      },
    ],
    post: {
      tags: ['main', 'organization', 'invite'],
      description: 'Respond to a given invitation.',
      operationId: 'respondOrganizationInvite',
      requestBody: {
        description: `The response of the invitation.

        If response is true, user will join the organization. If response is false, the user declines the invite and the invite is removed.`,
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['response', 'token'],
              properties: {
                response: {
                  type: 'boolean',
                },
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The response has been processed.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
