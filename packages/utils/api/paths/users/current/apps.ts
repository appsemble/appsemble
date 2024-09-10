import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'user', 'current-user', 'app'],
    parameters: [
      {
        name: 'language',
        schema: { type: 'string' },
        description: 'The language to include the translations of, if available',
        in: 'query',
      },
    ],
    description: 'Get all apps that are editable by the user.',
    operationId: 'queryCurrentUserApps',
    responses: {
      200: {
        description: 'The list of all editable apps.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/App',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
