import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
