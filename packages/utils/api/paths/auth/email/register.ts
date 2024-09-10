import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
