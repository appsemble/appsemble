import { type OpenAPIV3 } from 'openapi-types';

export const AppMemberInfo: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object representing the OAuth2 info of a member of an app',
  additionalProperties: false,
  properties: {
    sub: {
      type: 'string',
      readOnly: true,
      description: 'The id of the app member.',
    },
    name: {
      type: 'string',
      description: 'The full name of the app member.',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'The email address of the app member.',
    },
    email_verified: {
      type: 'boolean',
      description: 'Whether this email address has been verified.',
    },
    picture: {
      type: 'string',
      format: 'url',
      description: 'The URL of the profile picture of the app member.',
    },
    locale: {
      type: 'string',
      description: 'The locale of the app member.',
    },
    zoneinfo: {
      enum: Intl.supportedValuesOf('timeZone'),
      description: 'The time zone of the app member.',
    },
    role: {
      type: 'string',
      description: 'The role of the app member within the app',
    },
    properties: {
      type: 'object',
      description: 'The custom properties of the app member.',
      additionalProperties: true,
    },
    unverifiedEmail: {
      type: 'string',
      description:
        'Unverified email of the app member which will replace the main email when verified',
    },
  },
};
