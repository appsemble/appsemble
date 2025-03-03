import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'auth', 'email'],
    description: 'Update password',
    operationId: 'patchPassword',
    responses: { 200: { description: 'Password changed.' } },
    security: [{ studio: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['newPassword', 'currentPassword'],
            properties: {
              newPassword: {
                type: 'string',
                minLength: 8,
              },
              currentPassword: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
};
