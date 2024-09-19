import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
