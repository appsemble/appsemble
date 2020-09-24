import type { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/resources/{resourceType}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get all resources of this app.',
      operationId: 'queryResources',
      parameters: [
        { $ref: '#/components/parameters/$filter' },
        { $ref: '#/components/parameters/$orderby' },
        { $ref: '#/components/parameters/$top' },
      ],
      responses: {
        200: {
          description: 'The list of all this app’s resources of this type.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Resource',
                },
              },
            },
            'text/csv': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, {}],
    },
    post: {
      tags: ['resource'],
      description: 'Create a new resource for this app.',
      operationId: 'createResource',
      requestBody: {
        required: true,
        $ref: '#/components/requestBodies/resource',
      },
      responses: {
        201: {
          description: 'The resource that was created.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, {}],
    },
  },
  '/api/apps/{appId}/resources/{resourceType}/subscriptions': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
      { $ref: '#/components/parameters/endpoint' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get the current subscription status of this resource.',
      operationId: 'getResourceTypeSubscription',
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
  '/api/apps/{appId}/resources/{resourceType}/{resourceId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
      { $ref: '#/components/parameters/resourceId' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get a single app resource.',
      operationId: 'getResourceById',
      responses: {
        200: {
          description: 'The resource that matches the given id.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, {}],
    },
    put: {
      tags: ['resource'],
      description: 'Update an existing app resource.',
      operationId: 'updateResource',
      requestBody: {
        required: true,
        $ref: '#/components/requestBodies/resource',
      },
      responses: {
        200: {
          description: 'The updated resource.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, {}],
    },
    delete: {
      tags: ['resource'],
      description: 'Delete an existing app resource.',
      operationId: 'deleteResource',
      responses: {
        204: {
          description: 'The app resource has been deleted succesfully.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, {}],
    },
  },
  '/api/apps/{appId}/resources/{resourceType}/{resourceId}/subscriptions': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
      { $ref: '#/components/parameters/resourceId' },
      { $ref: '#/components/parameters/endpoint' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get the subscription status of a resource.',
      operationId: 'getResourceSubscription',
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
