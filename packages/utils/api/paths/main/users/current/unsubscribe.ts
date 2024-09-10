import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/users/current/unsubscribe': {
    post: {
      tags: ['main', 'user', 'current-user'],
      description: 'Unsubscribe a user from the newsletter',
      operationId: 'unsubscribeCurrentUser',
      responses: {
        201: { description: 'Unsubscribed successfully' },
        401: { description: 'Invalid or missing admin API secret' },
      },
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
    },
  },
};
