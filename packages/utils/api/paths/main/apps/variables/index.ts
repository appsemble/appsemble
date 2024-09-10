import { type OpenAPIV3 } from 'openapi-types';

import { paths as idPaths } from './variableId.js';

export const paths: OpenAPIV3.PathsObject = {
  ...idPaths,
  '/api/apps/{appId}/variables': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['main', 'app', 'variable'],
      operationId: 'createAppVariable',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppVariable' },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        201: {
          description: 'The created app variable.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppVariable' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['main', 'app', 'variable'],
      operationId: 'deleteAppVariables',
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        204: {
          description: 'The deleted app variables.',
        },
      },
    },
  },
};
