import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  patch: {
    tags: ['app', 'auth', 'email'],
    description: 'Patch password of the app member',
    operationId: 'patchAppMemberPassword',
    responses: {
      200: {
        description: 'Successfully updated password',
      },
    },
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
    security: [{ app: [] }, {}],
  },
};
