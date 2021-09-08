import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/member': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['appMember'],
      description: 'Register a new account using an email address and a password.',
      operationId: 'registerMemberEmail',
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
  '/api/apps/{appId}/member/verify': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['appMember'],
      description: 'Verify the email address of a registered user.',
      operationId: 'verifyMemberEmail',
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
  '/api/apps/{appId}/member/resend': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['appMember'],
      description: 'Resend the verification code for a registered email.',
      operationId: 'resendMemberEmailVerification',
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
  '/api/apps/{appId}/member/reset/request': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['appMember'],
      description: 'Request a reset token for resetting passwords.',
      operationId: 'requestMemberResetPassword',
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
  '/api/apps/{appId}/member/reset': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['appMember'],
      description: 'Reset a password using a password reset token.',
      operationId: 'resetMemberPassword',
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
