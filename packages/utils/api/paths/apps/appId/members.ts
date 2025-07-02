import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/roles' },
    { $ref: '#/components/parameters/selectedGroupId' },
    { $ref: '#/components/parameters/$filter' },
  ],
  get: {
    tags: ['common', 'app', 'member'],
    description: 'Fetch all members of an app.',
    operationId: 'queryAppMembers',
    security: [{ studio: [] }, { app: ['openid'] }, {}],
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
  },
};
