import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'totp'],
    description:
      'Initialize TOTP setup for the current app member. Returns a secret and otpauth URL for QR code generation. App members who still have to enroll to complete their login identify themselves with the pending TOTP token from the first login step instead of an access token.',
    operationId: 'setupAppMemberTotp',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
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
        description: 'TOTP secret and QR code URL generated successfully.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                secret: {
                  type: 'string',
                  description: 'The TOTP secret key.',
                },
                otpauthUrl: {
                  type: 'string',
                  description: 'The otpauth URL for generating a QR code.',
                },
              },
            },
          },
        },
      },
      400: {
        description: 'TOTP is already enabled for this member or TOTP is disabled for this app.',
      },
      401: {
        description: 'User is not authenticated.',
      },
    },
    security: [{ app: [] }, {}],
  },
};
