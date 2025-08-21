import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
              phoneNumber: {
                type: 'string',
                description: 'Phone number',
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
