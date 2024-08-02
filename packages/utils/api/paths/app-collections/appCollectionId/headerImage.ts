import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
