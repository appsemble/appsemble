import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/resourceId' },
  ],
  get: {
    tags: ['main', 'app', 'resource', 'version'],
    description: 'Get the known history of a resource',
    operationId: 'getAppResourceVersions',
    responses: {
      200: {
        description: 'The resource that matches the given id.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/responses/resource',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
