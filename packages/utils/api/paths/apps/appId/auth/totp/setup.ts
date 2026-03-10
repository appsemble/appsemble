import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'totp'],
    description:
      'Initialize TOTP setup for the current app member. Returns a secret and otpauth URL for QR code generation. When TOTP is required for the app, unauthenticated setup is allowed by providing a memberId.',
    operationId: 'setupAppMemberTotp',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              memberId: {
                type: 'string',
                format: 'uuid',
                description:
                  'The app member ID. Only used for unauthenticated setup when TOTP is required.',
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
      403: {
        description: 'Unauthenticated TOTP setup is only allowed when TOTP is required.',
      },
    },
    security: [{ app: [] }, {}],
  },
};
