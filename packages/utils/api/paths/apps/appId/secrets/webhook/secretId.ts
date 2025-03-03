import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/webhookSecretId' },
  ],
  get: {
    tags: ['main', 'app', 'secret', 'webhook'],
    operationId: 'getAppWebhookSecret',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The requested webhook secret.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                secret: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
  put: {
    tags: ['main', 'app', 'secret', 'webhook'],
    operationId: 'updateAppWebhookSecret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppWebhookSecret' },
        },
      },
    },
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The updated app webhook secret.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppWebhookSecret' },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app', 'secret', 'webhook'],
    operationId: 'deleteAppWebhookSecret',
    security: [{ studio: [] }],
    responses: {
      204: {
        description: 'The deleted app webhook secret.',
      },
    },
  },
};
