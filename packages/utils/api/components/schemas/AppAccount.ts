import { OpenAPIV3 } from 'openapi-types';

export const AppAccount: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An user account connected to an app',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description: 'The name as it is available in the app.',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'The email address as it is available in the app.',
    },
    email_verified: {
      type: 'boolean',
      description: 'Whether this email address has been verified.',
    },
    role: {
      type: 'string',
      description: 'The role of the user within the app',
    },
    app: {
      $ref: '#/components/schemas/AppDefinition',
    },
    sso: {
      type: 'array',
      description: 'The single sign on configurations which link the user to an external account.',
      items: { $ref: '#/components/schemas/SSOConfiguration' },
    },
    avatar: {
      type: 'string',
      format: 'url',
      description: 'The URL of the avatar of the member.',
    },
  },
};
