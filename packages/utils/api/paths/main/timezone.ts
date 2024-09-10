import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/timezones': {
    get: {
      tags: ['main'],
      description: 'Get a list of timezones supported by the API',
      operationId: 'getTimezones',
      responses: {
        200: {
          description: 'A list of timezones supported by the API',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};
