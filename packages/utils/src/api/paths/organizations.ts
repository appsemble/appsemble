import { OpenAPIV3 } from 'openapi-types';

import { roles } from '../../constants';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations': {
    get: {
      tags: ['organization'],
      description: 'Fetch the list of organizations.',
      operationId: 'getOrganizations',
      responses: {
        200: {
          description: 'The list of of organizations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Organization',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['organization'],
      description: 'Create a new organization.',
      operationId: 'createOrganization',
      requestBody: {
        description: 'The organization to create',
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                name: {
                  $ref: '#/components/schemas/Organization/properties/name',
                },
                description: {
                  $ref: '#/components/schemas/Organization/properties/description',
                },
                email: {
                  $ref: '#/components/schemas/Organization/properties/email',
                },
                website: {
                  $ref: '#/components/schemas/Organization/properties/website',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The organization icon.',
                },
              },
            },
            encoding: {
              icon: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
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
  '/api/organizations/{organizationId}': {
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
    patch: {
      tags: ['organization'],
      description: 'Update an organization',
      operationId: 'patchOrganization',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  $ref: '#/components/schemas/Organization/properties/name',
                },
                description: {
                  $ref: '#/components/schemas/Organization/properties/description',
                },
                email: {
                  $ref: '#/components/schemas/Organization/properties/email',
                },
                website: {
                  $ref: '#/components/schemas/Organization/properties/website',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The organization icon.',
                },
              },
            },
            encoding: {
              icon: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        200: { $ref: '#/components/responses/organization' },
      },
      security: [{ studio: [] }, { cli: ['organizations:write'] }],
    },
  },
  '/api/organizations/{organizationId}/icon': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get the organization icon.',
      operationId: 'getOrganizationIcon',
      responses: {
        200: {
          description: 'The icon that represents the organization.',
        },
      },
    },
  },
  '/api/organizations/{organizationId}/members': {
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
      security: [{ studio: [] }],
    },
  },
  '/api/organizations/{organizationId}/invites/resend': {
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
  '/api/organizations/{organizationId}/join': {
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
  '/api/organizations/{organizationId}/invites': {
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
      tags: ['organization'],
      description: 'Invite a new member to the organization that matches the given id.',
      operationId: 'inviteMembers',
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
  '/api/organizations/{organizationId}/members/{memberId}': {
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
  '/api/organizations/{organizationId}/members/{memberId}/role': {
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
                  enum: Object.keys(roles),
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
  '/api/organizations/{organizationId}/apps': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      parameters: [
        {
          name: 'language',
          schema: { type: 'string' },
          description: 'The language to include the translations of, if available',
          in: 'query',
        },
      ],
      description:
        'Get a list of an organization’s apps. Private apps are excluded unless the user is in the organization.',
      operationId: 'getOrganizationApps',
      responses: {
        200: {
          description: 'The list of this organization’s apps.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/App',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/api/organizations/{organizationId}/blocks': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['organization'],
      description: 'Get a list of an organization’s blocks.',
      operationId: 'getOrganizationBlocks',
      responses: {
        200: {
          description: 'The list of this organization’s blocks.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BlockVersion',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
};
