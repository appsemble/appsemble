import { type OpenAPIV3 } from 'openapi-types';

import { organizationRoles } from '../../../../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
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
    operationId: 'updateOrganizationMemberRole',
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
                enum: Object.keys(organizationRoles),
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
};
