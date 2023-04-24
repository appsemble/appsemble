import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/health': {
    get: {
      tags: ['health'],
      description: 'Check whether or not the API is healthy',
      operationId: 'checkHealth',
      responses: {
        200: {
          description: 'An indication the server is healthy.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Health',
              },
            },
          },
        },
      },
    },
  },
  '/api/ssl': {
    get: {
      tags: ['health'],
      description: 'Check the SSL certificate status for the given domain names.',
      operationId: 'getSSLStatus',
      parameters: [
        {
          in: 'query',
          name: 'domains',
          required: true,
          schema: { type: 'array', items: { type: 'string', format: 'hostname' } },
        },
      ],
      responses: {
        200: {
          description: 'A mapping of domain name to their SSL status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: {
                  enum: ['error', 'missing', 'pending', 'ready', 'unknown'],
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/timezones': {
    get: {
      tags: ['health'],
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
