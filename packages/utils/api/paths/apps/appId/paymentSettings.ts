import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app'],
    operationId: 'getAppPaymentSettings',
    description: 'Get app payment settings configuration',
    responses: {
      200: {
        description: 'The app payment configuration',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                stripeApiSecretKey: {
                  type: 'boolean',
                  description: 'Whether stripe api key is set.',
                },
                stripeWebhookSecret: {
                  type: 'boolean',
                  description: 'Whether stripe secret is set.',
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
            },
          },
        },
      },
    },
    parameters: [
      {
        in: 'path',
        name: 'appId',
        description: 'App that is creating the checkout.',
        schema: { type: 'number' },
      },
    ],
    security: [{ studio: [] }],
  },
  patch: {
    tags: ['main', 'app'],
    operationId: 'updateAppPaymentSettings',
    description: 'Update app payment settings configuration',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              stripeApiSecretKey: {
                type: 'string',
                description:
                  'The private API key used for accessing Stripe account connected to the app.',
              },
              stripeWebhookSecret: {
                type: 'string',
                description:
                  'The private secret used for authenticating app related Stripe webhooks.',
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
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The app payment configuration',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppPaymentSettings' },
          },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
};
