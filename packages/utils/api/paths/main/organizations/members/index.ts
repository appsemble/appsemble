import { type OpenAPIV3 } from 'openapi-types';

import { roles } from '../../../../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations/{organizationId}/members': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    get: {
      tags: ['main', 'organization', 'member'],
      description: 'Get a list of organization members.',
      operationId: 'getOrganizationMembers',
      responses: {
        200: {
          description: 'The list of all members.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrganizationMember',
                },
              },
            },
          },
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
      tags: ['main', 'organization', 'member'],
      description:
        'Remove a member from the organization that matches the given id, or leave the organization if the member id matches the user’s member id',
      operationId: 'removeOrganizationMember',
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
      tags: ['main', 'organization', 'member'],
      description: 'Set the role of the member within the organization.',
      operationId: 'setOrganizationMemberRole',
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
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
};
