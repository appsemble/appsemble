import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/webhookName' },
  ],
  post: {
    tags: ['main', 'app', 'webhook'],
    description: 'Call a webhook defined in the app',
    operationId: 'callAppWebhook',
    responses: {
      200: {
        description: 'The webhook was called successfully.',
      },
    },
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    security: [{ webhook: [] }],
  },
};
