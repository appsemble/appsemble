import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'totp'],
    description:
      'Verify a TOTP token to complete the TOTP setup process and enable two-factor authentication. When TOTP is required for the app, unauthenticated verification is allowed by providing a memberId.',
    operationId: 'verifyAppMemberTotpSetup',
    requestBody: {
      description: 'The TOTP token to verify.',
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
              memberId: {
                type: 'string',
                format: 'uuid',
                description:
                  'The app member ID. Only used for unauthenticated verification when TOTP is required.',
              },
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: 'TOTP has been successfully enabled.',
      },
      400: {
        description: 'Invalid TOTP token or TOTP setup not initiated.',
      },
      401: {
        description: 'User is not authenticated.',
      },
      403: {
        description: 'Unauthenticated TOTP verification is only allowed when TOTP is required.',
      },
    },
    security: [{ app: [] }, {}],
  },
};
