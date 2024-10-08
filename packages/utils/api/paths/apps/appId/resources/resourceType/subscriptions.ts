import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/endpoint' },
  ],
  get: {
    tags: ['common', 'app', 'resource', 'subscription'],
    description: 'Get the current subscription status of this resource.',
    operationId: 'getAppResourceTypeSubscription',
    responses: {
      200: {
        description: 'The subscription status for this resource.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResourceSubscription',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['openid'] }, {}],
  },
};
