export default {
  '/email': {
    post: {
      tags: ['user'],
      description: 'Register a new account using an email address and a password.',
      operationId: 'registerEmail',
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
  '/email/verify': {
    post: {
      tags: ['user'],
      description: 'Verify the email address of a registered user.',
      operationId: 'verifyEmail',
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
  '/email/resend': {
    post: {
      tags: ['user'],
      description: 'Resend the verification code for a registered email.',
      operationId: 'resendEmailVerification',
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
  '/email/reset/request': {
    post: {
      tags: ['user'],
      description: 'Request a reset token for resetting passwords.',
      operationId: 'requestResetPassword',
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
  '/email/reset': {
    post: {
      tags: ['user'],
      description: 'Reset a password using a password reset token.',
      operationId: 'resetPassword',
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
