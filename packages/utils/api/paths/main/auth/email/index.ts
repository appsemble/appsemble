import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/auth/email/register': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Register a new studio account using an email address and a password.',
      operationId: 'registerUserWithEmail',
      requestBody: {
        description: 'The user account to register.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
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
                timezone: {
                  enum: Intl.supportedValuesOf('timeZone'),
                },
                subscribed: {
                  type: 'boolean',
                  default: false,
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
  '/api/main/auth/email/verify': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Verify the email address of a registered user.',
      operationId: 'verifyUserEmail',
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
  '/api/main/auth/email/resend-verification': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Resend the verification code for a registered email.',
      operationId: 'resendUserEmailVerification',
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
      security: [{ studio: [] }],
    },
  },
  '/api/main/auth/email/login': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Login using the Appsemble studio.',
      operationId: 'loginUserWithEmail',
      responses: { 200: { description: 'Logged in successfully.' } },
      security: [{ basic: [] }],
    },
  },
  '/api/main/auth/email/request-password-reset': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Request a reset token for resetting passwords.',
      operationId: 'requestUserPasswordReset',
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
  '/api/main/auth/email/reset-password': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Reset a password using a password reset token.',
      operationId: 'resetUserPassword',
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
