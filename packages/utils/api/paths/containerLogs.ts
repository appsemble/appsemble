import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['container'],
    description: 'Retrieve the logs related to a companion container',
    operationId: 'getContainerLogs',
    parameters: [
      {
        name: 'appId',
        schema: { type: 'number' },
        description: 'Id of the app which defines the companion container',
        in: 'path',
      },
      {
        name: 'container',
        schema: { type: 'string' },
        description: 'Name of the companion container to fetch the logs for',
        in: 'path',
      },
    ],
    responses: {
      200: {
        description: 'Logs of the container running in a specific app',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {},
            },
          },
        },
      },
    },
    security: [{ studio: [] }],
  },
};
