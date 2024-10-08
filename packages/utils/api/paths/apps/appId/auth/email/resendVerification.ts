import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'email'],
    description: 'Resend the verification code for a registered email.',
    operationId: 'resendAppMemberEmailVerification',
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
        description: 'The verification email was sent if an account was found in the database.',
      },
    },
    security: [{ app: ['email'] }],
  },
};
