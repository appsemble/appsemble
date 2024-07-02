import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
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
