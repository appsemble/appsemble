import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
