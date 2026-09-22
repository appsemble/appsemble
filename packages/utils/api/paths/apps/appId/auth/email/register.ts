import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'email'],
    description: 'Register a new app account using an email address and a password.',
    operationId: 'registerAppMemberWithEmail',
    requestBody: {
      description: 'The user account to register.',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['email', 'password', 'timezone'],
            properties: {
              name: {
                type: 'string',
              },
              email: {
                type: 'string',
                format: 'email',
              },
              password: {
                type: 'string',
                minLength: 8,
              },
              picture: {
                type: 'string',
                format: 'binary',
                description: 'The account’s profile picture.',
              },
              properties: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'The member’s custom properties.',
              },
              timezone: {
                enum: Intl.supportedValuesOf('timeZone'),
              },
              phoneNumber: {
                type: 'string',
                description: 'Phone number',
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'The tokens for the session of the account that was created.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['access_token', 'expires_in', 'token_type'],
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
      401: {
        description: `The account was created, but no session was started.

On apps which require TOTP the second factor has to be verified before any token is issued. The
account exists either way, so this is the same challenge the other authentication endpoints
respond with.`,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['data'],
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                statusCode: { type: 'number' },
                data: {
                  type: 'object',
                  required: ['totpRequired', 'totpEnabled', 'totpToken'],
                  properties: {
                    totpRequired: {
                      type: 'boolean',
                      description: 'Whether a second factor has to be verified before logging in.',
                    },
                    totpEnabled: {
                      type: 'boolean',
                      description: 'Whether the app member has already enrolled in TOTP.',
                    },
                    totpToken: {
                      type: 'string',
                      description: 'The pending TOTP token to verify the second factor with.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
