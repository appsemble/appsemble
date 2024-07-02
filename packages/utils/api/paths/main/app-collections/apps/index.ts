import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/app-collections/{appCollectionId}/apps': {
    get: {
      tags: ['main', 'app-collection', 'app'],
      description: 'Get a list of apps in an app collection',
      operationId: 'queryAppCollectionApps',
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
      tags: ['main', 'app-collection', 'app'],
      description: 'Add an app to an app collection',
      operationId: 'addAppToAppCollection',
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
  '/api/app-collections/{appCollectionId}/apps/{appId}': {
    delete: {
      tags: ['main', 'app-collection', 'app'],
      description: 'Remove an app from an app collection',
      operationId: 'removeAppFromAppCollection',
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
  '/api/app-collections/{appCollectionId}/apps/{appId}/pinned': {
    post: {
      tags: ['main', 'app-collection', 'app'],
      description: 'Pin an app to an app collection',
      operationId: 'pinAppToAppCollection',
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
      tags: ['main', 'app-collection', 'app'],
      description: 'Unpin an app from an app collection',
      operationId: 'unpinAppFromAppCollection',
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
