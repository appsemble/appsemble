import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/login': {
    post: {
      tags: ['user'],
      description: 'Login using the Appsemble studio.',
      operationId: 'emailLogin',
      responses: { 200: { description: 'Logged in successfully.' } },
      security: [{ basic: [] }],
    },
  },
  '/api/user/apps': {
    get: {
      tags: ['app'],
      parameters: [
        {
          name: 'language',
          schema: { type: 'string' },
          description: 'The language to include the translations of, if available',
          in: 'query',
        },
      ],
      description: 'Get all apps that are editable by the user.',
      operationId: 'queryMyApps',
      responses: {
        200: {
          description: 'The list of all editable apps.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/App',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/refresh': {
    post: {
      tags: ['user'],
      description: 'Refresh an access token using the Appsemble studio',
      operationId: 'refreshToken',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refresh_token'],
              properties: {
                refresh_token: {
                  type: 'string',
                  description: 'The refresh token to use for refreshing the session.',
                },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'The token has been refreshed successfully.' } },
    },
  },
  '/api/user': {
    get: {
      tags: ['user'],
      description: "Fetch the logged in user's profile.",
      operationId: 'getUser',
      responses: {
        200: {
          description: "The user's profile.",
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    put: {
      tags: ['user'],
      description: "Update the logged in user's profile.",
      operationId: 'updateUser',
      requestBody: {
        required: true,
        $ref: '#/components/requestBodies/user',
      },
      responses: {
        200: {
          description: "The user's profile.",
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/user/organizations': {
    get: {
      tags: ['template'],
      description: "Fetch the logged in user's organizations.",
      operationId: 'getUserOrganizations',
      responses: {
        200: {
          description: 'The organizations the logged in user is a member of.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { $ref: '#/components/schemas/Organization/properties/id' },
                    name: { $ref: '#/components/schemas/Organization/properties/name' },
                    role: { $ref: '#/components/schemas/OrganizationMember/properties/role' },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/user/email': {
    get: {
      tags: ['user'],
      description: "List email addresses registered to logged in user's account.",
      operationId: 'listEmails',
      responses: {
        200: {
          description: 'The email address has been added successfully.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/UserEmail',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    post: {
      tags: ['user'],
      description: "Register a new email to logged in user's account.",
      operationId: 'addEmail',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserEmail',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The email address has been added successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserEmail',
              },
            },
          },
        },
      },
      security: [{ studio: [] }],
    },
    delete: {
      tags: ['user'],
      description: "Remove an existing email to logged in user's account.",
      operationId: 'removeEmail',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserEmail',
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The email address has been removed successfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/user/apps/accounts': {
    get: {
      description: 'Get the accounts that have been linked to an app and the user',
      tags: ['user'],
      operationId: 'getAppAccounts',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A list of linked accounts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/AppAccount',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/user/apps/{appId}/account': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      description: 'Get a single account that has been linked to an app and the current user',
      tags: ['user'],
      operationId: 'getAppAccount',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A list of linked accounts',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppAccount',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['appMember'],
      description: 'Register a new app account using an email address and a password.',
      operationId: 'registerMemberEmail',
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
                timezone: { type: 'string' },
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
    patch: {
      description: 'Update user data for a specific app',
      tags: ['user'],
      operationId: 'patchAppAccount',
      security: [{ studio: [] }, { app: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                },
                name: {
                  type: 'string',
                },
                picture: {
                  type: 'string',
                  format: 'binary',
                  description: 'The member’s profile picture.',
                },
                properties: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'The member’s custom properties.',
                },
                locale: {
                  type: 'string',
                  description: 'The preferred locale of the user.',
                },
              },
            },
            encoding: {
              picture: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'A linked app account',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppAccount',
              },
            },
          },
        },
      },
    },
  },
  '/api/user/apps/{appId}/accounts': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['appMember'],
      description: 'Fetch app accounts by roles.',
      operationId: 'getAppMembersByRoles',
      parameters: [{ $ref: '#/components/parameters/roles' }],
      security: [{ app: [] }],
      responses: {
        200: {
          description: 'The accounts that were fetched.',
        },
      },
    },
    post: {
      tags: ['appMember'],
      description: 'Create a new app account using an email address and a password.',
      operationId: 'createMemberEmail',
      security: [{ app: [] }],
      requestBody: {
        description: 'The user account to create.',
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
                properties: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'The member’s custom properties.',
                },
                timezone: { type: 'string' },
                role: {
                  type: 'string',
                  description:
                    "The role for the created account. Defaults to the default role in the app's security definition.",
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
  '/api/user/apps/{appId}/accounts/{memberEmail}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/memberEmail' },
    ],
    patch: {
      tags: ['appMember'],
      description: 'Patch an app account by email.',
      operationId: 'updateAppMemberByEmail',
      security: [{ app: [] }],
      requestBody: {
        description: 'The user account to update.',
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['password'],
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
                properties: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'The member’s custom properties.',
                },
                role: {
                  type: 'string',
                  description:
                    "The role for the updated account. Defaults to the default role in the app's security definition.",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'A linked app account',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppAccount',
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['appMember'],
      description: 'Delete a user account by email.',
      operationId: 'deleteAppMemberByEmail',
      security: [{ app: [] }],
      responses: {
        204: {
          description: 'The account was deleted successfully.',
        },
      },
    },
  },
  '/api/user/apps/{appId}/account/verify': {
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
  '/api/user/apps/{appId}/account/resend': {
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
      security: [{ studio: [] }, { app: ['email'] }],
    },
  },
  '/api/user/apps/{appId}/account/reset/request': {
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
  '/api/user/apps/{appId}/account/reset': {
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
  '/api/subscribed': {
    get: {
      tags: ['user'],
      description: 'Get a list of active and verified users subscribed to the appsemble newsletter',
      operationId: 'getSubscribedUsers',
      responses: {
        200: { description: 'List of subscribed users' },
        401: { description: 'Invalid or missing admin API secret' },
      },
    },
  },
  '/api/unsubscribe': {
    post: {
      tags: ['user'],
      description: 'Unsubscribe a user from the newsletter',
      operationId: 'unsubscribe',
      responses: {
        201: { description: 'Unsubscribed successfully' },
        401: { description: 'Invalid or missing admin API secret' },
      },
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
    },
  },
};
