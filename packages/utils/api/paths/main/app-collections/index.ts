import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';
import { paths as collectionIdPaths } from './collectionId.js';
import { paths as headerImagePaths } from './headerImage.js';
import { paths as profileImagePaths } from './profileImage.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appsPaths,
  ...headerImagePaths,
  ...profileImagePaths,
  ...collectionIdPaths,
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
};
