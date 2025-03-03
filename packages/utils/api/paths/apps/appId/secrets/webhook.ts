import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'webhook'],
    operationId: 'createAppWebhookSecret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppWebhookSecret' },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      201: {
        description: 'The created app webhook secret.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppWebhookSecret' },
          },
        },
      },
    },
  },
  get: {
    tags: ['main', 'app', 'secret', 'webhook'],
    operationId: 'getAppWebhookSecrets',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The list of app webhook secrets.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/AppWebhookSecret' },
            },
          },
        },
      },
    },
  },
};
