import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { in: 'query', name: 'demo', description: 'Whether to fetch demo app members' },
  ],
  get: {
    tags: ['common', 'app', 'member'],
    description: 'Fetch all members of an app.',
    operationId: 'getAppMembers',
    responses: {
      200: {
        description: 'The list of app members.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AppMemberInfo',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['openid'] }],
  },
};
