import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/common/apps/{appId}/resources/{resourceType}/subscriptions': {
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
  },
  '/api/common/apps/{appId}/resources/{resourceType}/{resourceId}/subscriptions': {
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
  },
};
