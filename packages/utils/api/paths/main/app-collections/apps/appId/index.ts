import { type OpenAPIV3 } from 'openapi-types';

import { paths as pinnedPaths } from './pinned.js';

export const paths: OpenAPIV3.PathsObject = {
  ...pinnedPaths,
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
};
