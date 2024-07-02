import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appsPaths,
  '/api/app-collections': {
    get: {
      tags: ['main', 'app-collection'],
      description: 'Get a list of app collections',
      operationId: 'queryAppCollections',
      responses: {
        200: {
          description: 'A list of app collections',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/AppCollection',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/api/app-collections/{appCollectionId}': {
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
  },
  '/api/app-collections/{appCollectionId}/header-image': {
    get: {
      tags: ['main', 'app-collection'],
      description: 'Get an app collection’s header image',
      operationId: 'getAppCollectionHeaderImage',
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
          description: 'The app collection’s header image',
          content: {
            'image/png': {},
            'image/jpeg': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/api/app-collections/{appCollectionId}/expert/profile-image': {
    get: {
      tags: ['main', 'app-collection'],
      description: 'Get an app collection’s expert’s profile image',
      operationId: 'getAppCollectionExpertProfileImage',
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
          description: 'The app collection’s expert’s profile image',
          content: {
            'image/png': {},
            'image/jpeg': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
};
