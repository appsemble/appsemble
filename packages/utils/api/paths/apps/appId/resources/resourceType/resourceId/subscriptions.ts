import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/resourceId' },
    { $ref: '#/components/parameters/endpoint' },
  ],
  get: {
    tags: ['common', 'app', 'resource', 'subscription'],
    description: 'Get the subscription status of a resource.',
    operationId: 'getAppResourceSubscription',
    responses: {
      200: {
        description: 'The subscription status of the resource that matches the given id.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                update: { type: 'boolean' },
                delete: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
};
