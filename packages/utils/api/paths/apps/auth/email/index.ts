import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/auth/email/register': {
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
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The account that was created.',
        },
      },
    },
  },
  '/api/apps/{appId}/auth/email/verify': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app', 'auth', 'email'],
      description: 'Verify the email address of a registered user.',
      operationId: 'verifyAppMemberEmail',
      requestBody: {
        description: 'The user account to register.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The account was successfully verified.',
        },
      },
    },
  },
  '/api/apps/{appId}/auth/email/resend-verification': {
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
  },
  '/api/apps/{appId}/auth/email/login': {
    post: {
      tags: ['app', 'auth', 'email'],
      description: 'Login using the Appsemble studio.',
      operationId: 'loginAppMemberWithEmail',
      responses: { 200: { description: 'Logged in successfully.' } },
      security: [{ basic: [] }],
    },
  },
  '/api/apps/{appId}/auth/email/request-password-reset': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app', 'auth', 'email'],
      description: 'Request a reset token for resetting passwords.',
      operationId: 'requestAppMemberPasswordReset',
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
          description: 'The request has been received and an email was sent if it exists.',
        },
      },
    },
  },
  '/api/apps/{appId}/auth/email/reset-password': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app', 'auth', 'email'],
      description: 'Reset a password using a password reset token.',
      operationId: 'resetAppMemberPassword',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password', 'token'],
              properties: {
                password: {
                  type: 'string',
                  minLength: 8,
                },
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The password has been reset.',
        },
      },
    },
  },
};
