import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/roles' },
    { $ref: '#/components/parameters/$filter' },
  ],
  get: {
    tags: ['common', 'app', 'demo-member'],
    description: 'Fetch all demo members of an app.',
    operationId: 'queryAppDemoMembers',
    responses: {
      200: {
        description: 'The list of app demo members.',
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
