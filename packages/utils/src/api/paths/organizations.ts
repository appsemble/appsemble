import type { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/organizations': {
    post: {
      tags: ['organization'],
      description: 'Create a new organization.',
      operationId: 'createOrganization',
      requestBody: {
        description: 'The organization to create',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Organization',
            },
          },
        },
      },
      responses: {
        201: {
          $ref: '#/components/responses/organization',
        },
      },
      security: [{ studio: [] }, { cli: ['organizations:write'] }],
    },
  },
  '/organizations/{organizationId}': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get a single organization.',
      operationId: 'getOrganization',
      responses: {
        200: {
          $ref: '#/components/responses/organization',
        },
      },
    },
  },
  '/organizations/{organizationId}/members': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get a list of organization members.',
      operationId: 'getMembers',
      responses: {
        200: {
          description: 'The list of all members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Member',
                },
              },
            },
          },
        },
      },
    },
  },
  '/organizations/{organizationId}/invites/resend': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    post: {
      tags: ['organization'],
      description: 'Request to resend an invitation.',
      operationId: 'resendInvitation',
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
  '/organizations/{organizationId}/join': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    post: {
      tags: ['organization'],
      description: 'Respond to a given invitation.',
      operationId: 'respondInvitation',
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
  '/organizations/{organizationId}/invites': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get a list of invited organization members.',
      operationId: 'getInvites',
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
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Invite a new member to the organization that matches the given id.',
      operationId: 'inviteMember',
      requestBody: {
        description: 'The member to invite.',
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
      tags: ['organization'],
      description: 'Revoke a member invitation.',
      operationId: 'removeInvite',
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
  '/organizations/{organizationId}/members/{memberId}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      {
        name: 'memberId',
        in: 'path',
        description: 'The ID of the member to remove',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    delete: {
      tags: ['organization'],
      description:
        'Remove a member from the organization that matches the given id, or leave the organization if the member id matches the user’s member id',
      operationId: 'removeMember',
      responses: {
        204: {
          description: 'The member has been successfully removed.',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/organizations/{organizationId}/members/{memberId}/role': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      {
        name: 'memberId',
        in: 'path',
        description: 'The ID of the member',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    put: {
      tags: ['organization'],
      description: 'Set the role of the member within the organization.',
      operationId: 'setRole',
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
                $ref: '#/components/schemas/Member',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/organizations/{organizationId}/style/shared': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get the shared style for this organization.',
      operationId: 'getOrganizationSharedStyle',
      responses: {
        200: {
          description: 'The shared stylesheet associated with this organization.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Upload a shared stylesheet for this organization.',
      operationId: 'setOrganizationSharedStyle',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['style'],
              properties: {
                style: {
                  description: 'The new organization shared stylesheet.',
                  type: 'string',
                  format: 'binary',
                },
              },
            },
            encoding: {
              style: { contentType: 'text/css' },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The shared style has been updated succesfully.',
        },
      },
      security: [{ cli: ['organizations:write'] }],
    },
  },
  '/organizations/{organizationId}/style/core': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get the core style for this organization.',
      operationId: 'getOrganizationCoreStyle',
      responses: {
        200: {
          description: 'The shared stylesheet associated with this organization.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Upload a core stylesheet for this organization.',
      operationId: 'setOrganizationCoreStyle',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['style'],
              properties: {
                style: {
                  description: 'The new organization shared stylesheet.',
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The shared style has been updated succesfully.',
        },
      },
      security: [{ cli: ['organizations:write'] }],
    },
  },
  '/organizations/{organizationId}/style/block/@{blockOrganizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/organizationId' },
      {
        $ref: '#/components/parameters/organizationId',
        name: 'blockOrganizationId',
        description: 'The organization ID of the block.',
      },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['organization'],
      description: 'Get the organization style for a block.',
      operationId: 'getOrganizationBlockStyle',
      responses: {
        200: {
          description: 'The stylesheet associated with this block for this organization.',
          content: {
            'text/css': {},
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Upload a block stylesheet for this organization.',
      operationId: 'setOrganizationBlockStyle',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['style'],
              properties: {
                style: {
                  description: 'The new organization block stylesheet.',
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The block style has been updated succesfully.',
        },
      },
      security: [{ cli: ['organizations:write'] }],
    },
  },
};
