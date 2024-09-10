import { type OpenAPIV3 } from 'openapi-types';

import { paths as idPaths } from './resourceId.js';

export const paths: OpenAPIV3.PathsObject = {
  idPaths,
  '/api/apps/{appId}/scim/ResourceTypes': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimResourceTypes',
      responses: {
        200: {
          description: 'SCIM user',
          content: {
            'application/scim+json': {
              schema: {
                // XXX
                // $ref: '#/components/schemas/ScimUser',
              },
            },
          },
        },
      },
    },
  },
};
