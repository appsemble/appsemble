import { type OpenAPIV3 } from 'openapi-types';

import { paths as rolePaths } from './role.js';

export const paths: OpenAPIV3.PathsObject = {
  ...rolePaths,
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
};
