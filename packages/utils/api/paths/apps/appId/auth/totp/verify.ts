import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'totp'],
    description:
      'Verify a TOTP token during login to complete the two-factor authentication process. The app member is identified by the pending TOTP token issued by the first login step, which is what binds both login steps together.',
    operationId: 'verifyAppMemberTotp',
    requestBody: {
      description: 'The pending TOTP token and the TOTP token to verify.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token', 'totpToken'],
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
                description: 'The pending TOTP token from the first login step.',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'TOTP verified successfully. Returns JWT tokens.',
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
        description: 'TOTP is not enabled for this member.',
      },
      401: {
        description: 'Invalid TOTP token, or a pending TOTP token which is invalid or spent.',
      },
      404: {
        description: 'App member not found.',
      },
      429: {
        description: 'Too many failed TOTP attempts.',
      },
    },
  },
};
