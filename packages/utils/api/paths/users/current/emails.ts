import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'user', 'current-user', 'email'],
    description: "List email addresses registered to logged in user's account.",
    operationId: 'listCurrentUserEmails',
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
    tags: ['main', 'user', 'current-user', 'email'],
    description: "Register a new email to logged in user's account.",
    operationId: 'addCurrentUserEmail',
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
    tags: ['main', 'user', 'current-user', 'email'],
    description: "Remove an existing email to logged in user's account.",
    operationId: 'removeCurrentUserEmail',
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
};
