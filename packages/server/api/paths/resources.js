export default {
  '/api/apps/{appId}/resources/{resourceType}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
    ],
    get: {
      tags: ['resource'],
      description: 'Get all resources of this app.',
      operationId: 'queryResources',
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
          },
        },
      },
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
      security: [{ apiUser: ['apps:write'] }],
    },
  },
};
