import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'member', 'email', 'auth'],
    operationId: 'requestAppMemberEmailUpdate',
    description: 'Update the email address of an app member',
    responses: {
      200: {
        description: 'The updated app member',
      },
    },
    requestBody: {
      description: '',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
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
    security: [{ app: ['email'] }],
  },
};
