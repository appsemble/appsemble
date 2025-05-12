import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization-subscription'],
    description: 'Fetch the price of a subscription.',
    operationId: 'getOrganizationSubscriptionPrice',
    parameters: [
      {
        in: 'query',
        name: 'subscriptionPlan',
        description: 'Subscription plan for which we need to calculate the price.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'period',
        description: 'Renewal period for which we need to calculate the price.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'couponCode',
        description: 'Coupon code that will be applied to the subscription.',
        schema: { type: 'string' },
      },
    ],
    responses: {
      200: { $ref: '#/components/responses/organizationSubscriptionPrice' },
    },
    security: [{ studio: [] }],
  },
};
