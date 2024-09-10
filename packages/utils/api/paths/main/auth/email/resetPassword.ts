import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/auth/email/reset-password': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Reset a password using a password reset token.',
      operationId: 'resetUserPassword',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password', 'token'],
              properties: {
                password: {
                  type: 'string',
                  minLength: 8,
                },
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The password has been reset.',
        },
      },
    },
  },
};
