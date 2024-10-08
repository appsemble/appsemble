import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app'],
    description: 'Get the current app icon.',
    operationId: 'getAppIcon',
    responses: {
      200: {
        description: 'The icon of the app that matches the given id.',
        content: {
          'image/png': {},
          'image/jpeg': {},
          'image/tiff': {},
          'image/webp': {},
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app'],
    description: 'Delete the current app icon.',
    operationId: 'deleteAppIcon',
    responses: {
      204: {
        description: 'The icon has been successfully removed',
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
};
