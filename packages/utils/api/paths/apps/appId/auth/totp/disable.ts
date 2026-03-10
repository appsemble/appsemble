import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'totp'],
    description: 'Disable TOTP two-factor authentication for the current app member.',
    operationId: 'disableAppMemberTotp',
    requestBody: {
      description: 'The TOTP token to verify before disabling.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token'],
            properties: {
              token: {
                type: 'string',
                minLength: 6,
                maxLength: 6,
                pattern: '^[0-9]{6}$',
                description: 'The 6-digit TOTP token from the authenticator app.',
              },
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: 'TOTP has been successfully disabled.',
      },
      400: {
        description: 'Invalid TOTP token or TOTP is not enabled.',
      },
      401: {
        description: 'User is not authenticated.',
      },
    },
    security: [{ app: [] }],
  },
};
