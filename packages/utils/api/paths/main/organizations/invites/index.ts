import { type OpenAPIV3 } from 'openapi-types';

import { paths as invitePaths } from './inviteToken/index.js';
import { paths as resendPaths } from './resend.js';
import { roles } from '../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...invitePaths,
  resendPaths,
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
};
