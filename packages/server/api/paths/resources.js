export default {
  '/api/apps/{appId}/{resourceType}': {
    parameters: [
      {
        name: 'appId',
        in: 'path',
        description: 'The id of the app.',
        schema: { type: 'integer' },
      },
      {
        name: 'resourceType',
        in: 'path',
        description: 'The resource type within this app.',
      },
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
  '/api/apps/{appId}/{resourceType}/{resourceId}': {
    parameters: [
      {
        name: 'appId',
        in: 'path',
        description: 'The id of the app this resource belongs to.',
      },
      {
        name: 'resourceType',
        in: 'path',
        description: 'The resource type within this app.',
      },
      {
        name: 'resourceId',
        in: 'path',
        description: 'The id of the resource.',
        schema: { type: 'integer' },
      },
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
  },
};
