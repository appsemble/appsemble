import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'payments'],
    description: 'Send an invoice.',
    operationId: 'sendInvoice',
    responses: {
      200: {
        description: 'Whether the invoice has been succesfully created and sent to Stripe.',
      },
    },
    parameters: [
      {
        in: 'query',
        name: 'organizationId',
        description: 'Organization that we want to invoice.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'subscriptionType',
        description: 'Subscription plan that we want to invoice for.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'period',
        description: 'Renewal period for which we want to invoice.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'couponCode',
        description: 'Coupon code that will be applied to the subscription.',
        schema: { type: 'string' },
      },
    ],
    security: [{ studio: [] }],
  },
};
