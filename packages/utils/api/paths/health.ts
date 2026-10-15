import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main'],
    description: 'Deprecated alias of `/health/ready`. Use `/health/live` for liveness probes.',
    operationId: 'checkHealth',
    deprecated: true,
    responses: {
      200: {
        description: 'The instance is ready to receive traffic.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Health',
            },
          },
        },
      },
      503: {
        description: 'The instance is draining or a hard dependency is unavailable.',
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
};
