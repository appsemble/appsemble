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
  get: {
    tags: ['common', 'app', 'group', 'members'],
    description: 'Fetch the members of a group and their roles within the group.',
    operationId: 'getGroupMembers',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
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
    security: [{ studio: [] }, { app: ['groups:read'] }],
  },
};
