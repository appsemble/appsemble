import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'emails'],
    description: 'Webhook for delivering response on undelivered emails.',
    parameters: [
      {
        name: 'secret',
        schema: { type: 'string' },
        description: 'Secret used to authenticate incoming Postal webhooks.',
        in: 'query',
      },
    ],
    operationId: 'undeliveredEmails',
    responses: {
      200: {
        description:
          'Response sent to Postal, should be 200 OK if we receive the webhook, regardless of our internals.',
      },
    },
  },
};
