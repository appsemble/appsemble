import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'app-collection'],
    description: 'Get an app collection',
    operationId: 'getAppCollection',
    parameters: [
      {
        name: 'appCollectionId',
        in: 'path',
        description: 'The id of the app collection',
        required: true,
        schema: {
          $ref: '#/components/schemas/AppCollection/properties/id',
        },
      },
    ],
    responses: {
      200: {
        description: 'An app collection',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppCollection',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
  patch: {
    tags: ['main', 'app-collection'],
    description: 'Update an app collection',
    operationId: 'updateAppCollection',
    parameters: [
      {
        name: 'appCollectionId',
        in: 'path',
        description: 'The id of the app collection',
        required: true,
        schema: {
          $ref: '#/components/schemas/AppCollection/properties/id',
        },
      },
    ],
    requestBody: {
      description: 'The app collection to update',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            $ref: '#/components/schemas/AppCollectionDefinition',
          },
          encoding: {
            expertProfileImage: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
            headerImage: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The updated app collection',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AppCollection',
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
  delete: {
    tags: ['main', 'app-collection'],
    description: 'Delete an app collection',
    operationId: 'deleteAppCollection',
    parameters: [
      {
        name: 'appCollectionId',
        in: 'path',
        description: 'The id of the app collection',
        required: true,
        schema: {
          $ref: '#/components/schemas/AppCollection/properties/id',
        },
      },
    ],
    responses: {
      204: {
        description: 'The app collection was deleted',
      },
    },
    security: [{ studio: [] }],
  },
};
