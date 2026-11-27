import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'testAppOAuth2SecretConnection',
    description: `Check whether the server can reach an OAuth2 provider and log in with it.

The checks use the same requests and network restrictions as a login.
`,
    security: [{ studio: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppOAuth2SecretTest' },
        },
      },
    },
    responses: {
      200: {
        description: 'The outcome of each check.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                required: ['check', 'status', 'reason'],
                properties: {
                  check: { type: 'string' },
                  status: { enum: ['fail', 'pass', 'skip', 'warn'] },
                  reason: { type: 'string' },
                  detail: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};
