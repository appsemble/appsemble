import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['app', 'member', 'current-member'],
    description: 'Get a list of groups that the app member is a member of.',
    operationId: 'getCurrentAppMemberGroups',
    responses: {
      200: {
        description: 'The list of groups of the app member.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ app: [] }],
  },
};
