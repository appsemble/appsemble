import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'payments'],
    description: 'Create checkout for in-app transaction.',
    operationId: 'createAppCheckout',
    responses: {
      200: {
        description: 'Whether the invoice has been succesfully created and sent to Stripe.',
      },
    },
    parameters: [
      {
        in: 'path',
        name: 'appId',
        description: 'App that is creating the checkout.',
        schema: { type: 'number' },
      },
      {
        in: 'query',
        name: 'price',
        description: 'Product that is being charged.',
        schema: { type: 'string' },
      },
      {
        in: 'query',
        name: 'locale',
        description: 'Locale that the app is currently shown in, to be used for Stripe checkout.',
        schema: { type: 'string' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Customer email address' },
            },
            required: ['email'],
          },
        },
      },
    },
  },
};
