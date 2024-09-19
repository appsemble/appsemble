import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'email'],
    description: 'Request a reset token for resetting passwords.',
    operationId: 'requestAppMemberPasswordReset',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: 'The request has been received and an email was sent if it exists.',
      },
    },
  },
};
