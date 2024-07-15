import { type OpenAPIV3 } from 'openapi-types';

import { paths as versionsPaths } from './versions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...versionsPaths,
  '/api/apps/{appId}/resources': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    delete: {
      tags: ['main', 'app', 'resource'],
      description: 'Delete all app seed resources.',
      operationId: 'deleteAppSeedResources',
      responses: {
        204: {
          description: 'The app resources have been deleted successfully.',
        },
      },
      security: [{ cli: ['resources:write'] }, {}],
    },
  },
};
