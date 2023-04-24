import { type OpenAPIV3 } from 'openapi-types';

export const subscriptions: OpenAPIV3.ResponseObject = {
  description: 'A subscription response.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        description: 'A mapping of resources names to resource subscriptions.',
        additionalProperties: {
          $ref: '#/components/schemas/ResourceSubscription',
        },
      },
    },
  },
};
