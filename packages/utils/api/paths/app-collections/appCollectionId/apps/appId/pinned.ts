import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
