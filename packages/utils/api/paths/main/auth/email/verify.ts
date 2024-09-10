import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/auth/email/verify': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Verify the email address of a registered user.',
      operationId: 'verifyUserEmail',
      requestBody: {
        description: 'The user account to register.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The account was successfully verified.',
        },
      },
    },
  },
};
