import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
