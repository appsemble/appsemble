import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/organizations/{organizationId}/apps/import': {
    parameters: [{ $ref: '#/components/parameters/organizationId' }],
    post: {
      tags: ['main', 'app'],
      description: 'Import an app from a zip file',
      operationId: 'importApp',
      requestBody: {
        content: {
          'application/zip': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'App imported successfully',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
