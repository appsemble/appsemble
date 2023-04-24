import { type OpenAPIV3 } from 'openapi-types';

export const UserEmail: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `
    An email address that is linked to a user.

    Users may use any of their email addresses to login.
  `,
  required: ['email'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'The email address that is registered',
    },
    verified: {
      type: 'boolean',
      readOnly: true,
      description: 'Wether or not the email address has been verified by the user.',
    },
  },
};
