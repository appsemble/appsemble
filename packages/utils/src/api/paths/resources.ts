import { OpenAPIV3 } from 'openapi-types';

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
        { $ref: '#/components/parameters/view' },
        { $ref: '#/components/parameters/$filter' },
        { $ref: '#/components/parameters/$orderby' },
        { $ref: '#/components/parameters/$select' },
        { $ref: '#/components/parameters/$top' },
        { $ref: '#/components/parameters/$team' },
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
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
    },
    post: {
      tags: ['resource'],
      description: 'Create a new resource for this app.',
      operationId: 'createResource',
      requestBody: {
        required: true,
        description: 'The resource to create',
        content: {
          'application/json': {
            schema: {
              anyOf: [
                { $ref: '#/components/schemas/Resource' },
                { type: 'array', items: { $ref: '#/components/schemas/Resource' } },
              ],
            },
          },
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['resource'],
              description: 'A `multipart/form-data` representation of a resource.',
              additionalProperties: false,
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Resource' },
                },
                assets: {
                  type: 'array',
                  description: 'A list of assets that should be linked to the resource.',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
          'text/csv': {
            schema: {
              type: 'array',
              items: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The resource that was created.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
    },
    put: {
      tags: ['resource'],
      description: 'Update existing app resources.',
      operationId: 'updateResources',
      requestBody: {
        required: true,
        description: 'The resources to update',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/Resource' },
            },
          },
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['resource'],
              description: 'A `multipart/form-data` representation of a resource.',
              additionalProperties: false,
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Resource' },
                },
                assets: {
                  type: 'array',
                  description: 'A list of assets that should be linked to the resources.',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
          'text/csv': {
            schema: {
              type: 'array',
              items: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated resources.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
    },
    delete: {
      tags: ['resource'],
      description: 'Delete multiple app resources.',
      operationId: 'deleteResources',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'array',
              description: 'An array of resource IDs to remove.',
              items: { type: 'number' },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The app resources have been deleted successfully.',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
    },
  },
  // XXX: Temporary workaround until this is fixed in Koas
  // See https://gitlab.com/remcohaszing/koas/-/issues/2
  '/api/apps/{appId}/resources/{resourceType}/\\$count': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get a count of all resources of this app.',
      operationId: 'countResources',
      parameters: [
        { $ref: '#/components/parameters/$filter' },
        { $ref: '#/components/parameters/$team' },
      ],
      responses: {
        200: {
          description: 'The count of all this app’s resources of this type.',
          content: {
            'application/json': {
              schema: {
                type: 'number',
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
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
      { $ref: '#/components/parameters/view' },
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
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
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
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
    },
    delete: {
      tags: ['resource'],
      description: 'Delete an existing app resource.',
      operationId: 'deleteResource',
      responses: {
        204: {
          description: 'The app resource has been deleted successfully.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:write'] }, {}],
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
