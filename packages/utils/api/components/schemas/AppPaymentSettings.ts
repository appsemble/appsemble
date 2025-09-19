import { type OpenAPIV3 } from 'openapi-types';

export const SSLSecret: OpenAPIV3.SchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'The payment settings of an app.',
  properties: {
    stripeApiSecretKey: {
      type: 'string',
      description: 'The private API key used for accessing Stripe account connected to the app.',
    },
    stripeWebhookSecret: {
      type: 'string',
      description: 'The private secret used for authenticating app related Stripe webhooks.',
    },
    successUrl: {
      type: 'string',
      description:
        'The url users are redirected to after successfully completing app related Stripe checkout session.',
    },
    cancelUrl: {
      type: 'string',
      description:
        'The url users are redirected to after unsuccessfully completing app related Stripe checkout session.',
    },
  },
};
