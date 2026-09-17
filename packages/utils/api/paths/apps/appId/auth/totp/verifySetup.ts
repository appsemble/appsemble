import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'totp'],
    description:
      'Verify a TOTP token to complete the TOTP setup process and enable two-factor authentication. App members who still have to enroll to complete their login identify themselves with the pending TOTP token from the first login step instead of an access token, in which case the login is completed and JWT tokens are returned.',
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
              totpToken: {
                type: 'string',
                description:
                  'The pending TOTP token from the first login step. Only used when no access token is available yet.',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description:
          'TOTP has been successfully enabled. When enrollment completed a pending login, JWT tokens are returned. Otherwise the response is empty with status 204.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                access_token: {
                  type: 'string',
                  description: 'The access token.',
                },
                expires_in: {
                  type: 'number',
                  description: 'Token expiration time in seconds.',
                },
                refresh_token: {
                  type: 'string',
                  description: 'The refresh token.',
                },
                token_type: {
                  type: 'string',
                  description: 'The token type (bearer).',
                },
              },
            },
          },
        },
      },
      400: {
        description: 'Invalid TOTP token or TOTP setup not initiated.',
      },
      401: {
        description: 'User is not authenticated.',
      },
      429: {
        description: 'Too many failed TOTP attempts.',
      },
    },
    security: [{ app: [] }, {}],
  },
};
