import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main'],
    description: 'Check the SSL certificate status for the given domain names.',
    operationId: 'getSslStatus',
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
};
