export default {
  '/api/login': {
    post: {
      tags: ['user'],
      description: 'Login using the Appsemble studio.',
      operationId: 'emailLogin',
      responses: { 200: { description: 'Logged in successfully.' } },
      security: [{ basic: [] }],
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
  '/api/user/email': {
    post: {
      tags: ['user'],
      description: "Register a new email to logged in user's account.",
      operationId: 'addEmail',
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
        201: {
          description: 'The email address has been added succesfully.',
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
          description: 'The email address has been removed succesfully.',
        },
      },
      security: [{ studio: [] }],
    },
  },
};
