import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/selectedGroupId' },
  ],
  get: {
    tags: ['common', 'app', 'resource'],
    description: 'Get all resources of this app.',
    operationId: 'queryAppResources',
    parameters: [
      { $ref: '#/components/parameters/view' },
      { $ref: '#/components/parameters/$filter' },
      { $ref: '#/components/parameters/$orderby' },
      { $ref: '#/components/parameters/$select' },
      { $ref: '#/components/parameters/$skip' },
      { $ref: '#/components/parameters/$top' },
      { $ref: '#/components/parameters/$own' },
      { $ref: '#/components/parameters/delimiter' },
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
    tags: ['common', 'app', 'resource'],
    description: 'Create a new resource for this app.',
    operationId: 'createAppResource',
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
    tags: ['common', 'app', 'resource'],
    description: 'Update existing app resources.',
    operationId: 'updateAppResources',
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
    tags: ['common', 'app', 'resource'],
    description: 'Delete multiple app resources.',
    operationId: 'deleteAppResources',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'array',
            description: 'An array of resource IDs to remove.',
            items: { $ref: '#/components/schemas/Resource/properties/id' },
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
};
