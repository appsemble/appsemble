import { type OpenAPIV3 } from 'openapi-types';

export const UserInfo: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object representing the OAuth2 info of a user',
  additionalProperties: false,
  properties: {
    sub: {
      type: 'string',
      readOnly: true,
      description: 'The id of the user.',
    },
    name: {
      type: 'string',
      description: 'The full name of the user.',
    },
    email: {
      type: 'string',
      description: 'The email of the user.',
    },
    email_verified: {
      type: 'boolean',
      description: 'Whether this email address has been verified.',
    },
    picture: {
      type: 'string',
      format: 'url',
      description: 'The URL of the profile picture of the user.',
    },
    locale: {
      type: 'string',
      description: 'The locale of the user.',
    },
    timezone: {
      enum: Intl.supportedValuesOf('timeZone'),
      description: 'The time zone of the user.',
    },
    subscribed: {
      type: 'boolean',
      description: 'If the user is subscribed to the newsletter.',
    },
  },
};
