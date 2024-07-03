import { type OpenAPIV3 } from 'openapi-types';

import { paths as schemaIdPaths } from './schemaId.js';

export const paths: OpenAPIV3.PathsObject = {
  ...schemaIdPaths,
  '/api/apps/{appId}/scim/Schemas': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimSchemas',
      responses: {
        200: {
          description: 'The SCIM Schema',
          content: {
            'application/scim+json': {
              schema: {
                $ref: '#/components/schemas/ScimUser',
              },
            },
          },
        },
      },
    },
  },
};
