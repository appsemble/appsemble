import { OpenAPIV3 } from 'openapi-types';

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
      responses: { 200: { description: 'The token has been refreshed succesfully.' } },
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
                    role: { $ref: '#/components/schemas/Member/properties/role' },
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
          description: 'The email address has been added succesfully.',
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
          description: 'The email address has been added succesfully.',
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
          description: 'The email address has been removed succesfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
