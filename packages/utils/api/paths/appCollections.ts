import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations/{organizationId}/appCollections': {
    get: {
      tags: ['appCollection'],
      description: 'Get a list of app collections for an organization',
      operationId: 'queryOrganizationCollections',
      parameters: [
        {
          name: 'organizationId',
          in: 'path',
          description: 'The id of the organization',
          required: true,
          schema: {
            $ref: '#/components/schemas/Organization/properties/id',
          },
        },
      ],
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
    post: {
      tags: ['appCollection'],
      description: 'Create an app collection',
      operationId: 'createCollection',
      parameters: [
        {
          name: 'organizationId',
          in: 'path',
          description: 'The id of the organization to create the app collection in',
          required: true,
          schema: {
            $ref: '#/components/schemas/Organization/properties/id',
          },
        },
      ],
      requestBody: {
        description: 'The app collection to create',
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/AppCollectionDefinition' },
                { required: ['name', 'expertName', 'expertProfileImage', 'headerImage'] },
              ],
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
        201: {
          description: 'The created app collection',
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
  },
  '/api/appCollections': {
    get: {
      tags: ['appCollection'],
      description: 'Get a list of app collections',
      operationId: 'queryCollections',
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
  '/api/appCollections/{appCollectionId}': {
    get: {
      tags: ['appCollection'],
      description: 'Get an app collection',
      operationId: 'getCollection',
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
      tags: ['appCollection'],
      description: 'Update an app collection',
      operationId: 'updateCollection',
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
      tags: ['appCollection'],
      description: 'Delete an app collection',
      operationId: 'deleteCollection',
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
  '/api/appCollections/{appCollectionId}/headerImage': {
    get: {
      tags: ['appCollection'],
      description: 'Get an app collection’s header image',
      operationId: 'getCollectionHeaderImage',
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
  '/api/appCollections/{appCollectionId}/expert/profileImage': {
    get: {
      tags: ['appCollection'],
      description: 'Get an app collection’s expert’s profile image',
      operationId: 'getCollectionExpertProfileImage',
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
  '/api/appCollections/{appCollectionId}/apps': {
    get: {
      tags: ['appCollection'],
      description: 'Get a list of apps in an app collection',
      operationId: 'queryCollectionApps',
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
        {
          name: 'language',
          in: 'query',
          description: 'The language to include the translations of, if available',
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: {
          description: 'A list of apps',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [
                    { $ref: '#/components/schemas/App' },
                    {
                      type: 'object',
                      properties: {
                        pinned: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
    post: {
      tags: ['appCollection'],
      description: 'Add an app to an app collection',
      operationId: 'addAppToCollection',
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
        description: 'The app to add to the app collection',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                AppId: {
                  $ref: '#/components/schemas/App/properties/id',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The app was added to the app collection',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/appCollections/{appCollectionId}/apps/{appId}': {
    delete: {
      tags: ['appCollection'],
      description: 'Remove an app from an app collection',
      operationId: 'removeAppFromCollection',
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
        {
          name: 'appId',
          in: 'path',
          description: 'The id of the app',
          required: true,
          schema: {
            $ref: '#/components/schemas/AppCollection/properties/id',
          },
        },
      ],
      responses: {
        204: {
          description: 'The app was removed from the app collection',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/appCollections/{appCollectionId}/apps/{appId}/pinned': {
    post: {
      tags: ['appCollection'],
      description: 'Pin an app to an app collection',
      operationId: 'pinAppToCollection',
      parameters: [
        {
          name: 'appCollectionId',
          in: 'path',
          description: 'The id of the app collection to pin the app to',
          required: true,
          schema: { $ref: '#/components/schemas/AppCollection/properties/id' },
        },
        {
          name: 'appId',
          in: 'path',
          description: 'The id of the app to pin',
          required: true,
          schema: { $ref: '#/components/schemas/App/properties/id' },
        },
      ],
      responses: {
        200: {
          description: 'The app was pinned to the app collection',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  pinned: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    delete: {
      tags: ['appCollection'],
      description: 'Unpin an app from an app collection',
      operationId: 'unpinAppFromCollection',
      parameters: [
        {
          name: 'appCollectionId',
          in: 'path',
          description: 'The id of the app collection to unpin the app from',
          required: true,
          schema: { $ref: '#/components/schemas/AppCollection/properties/id' },
        },
        {
          name: 'appId',
          in: 'path',
          description: 'The id of the app to unpin',
          required: true,
          schema: { $ref: '#/components/schemas/App/properties/id' },
        },
      ],
      responses: {
        204: {
          description: 'The app was unpinned from the app collection',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
