import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/icon': {
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
  },
};
