import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'demo-group'],
    description: 'Get a list of app groups.',
    operationId: 'getAppDemoGroups',
    responses: {
      200: {
        description: 'The list of all groups.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                description: 'An app demo group',
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};
