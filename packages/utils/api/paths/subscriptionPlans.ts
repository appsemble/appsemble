import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main'],
    description: 'Get the subscription plans organizations can subscribe to',
    operationId: 'getSubscriptionPlans',
    responses: {
      200: {
        description: 'The subscription plans, from the smallest to the largest',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SubscriptionPlan',
              },
            },
          },
        },
      },
    },
  },
};
