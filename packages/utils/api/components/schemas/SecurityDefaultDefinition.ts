import { type OpenAPIV3 } from 'openapi-types';

export const SecurityDefaultDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  required: ['role'],
  description: 'The default role to apply to members.',
  additionalProperties: false,
  properties: {
    policy: {
      enum: ['everyone', 'organization', 'invite'],
      default: 'everyone',
      description: `How the \`default\` role gets applied to users.

The following values are allowed:
- \`everyone\`: Every authenticated user gets the default role.
- \`organization\`: Every authenticated user gets the default role if they are in the same organization as the app.
- \`invite\`: The app member has to be invited to the app with a specific role.

> **Important**: When [OAuth2](../guides/oauth2) or [SAML2.0](../guides/saml) is used in the
> app, you must set the policy to \`everyone\`. This will specifically allow every configured
> authentication method on the secrets page to be used as login method. If you do not want other
> Appsemble user accounts to be able to log in, you must \`disable\` the \`appsemble login\` options
> (including the Appsemble OAuth2 option) in the secrets page. If this option is enabled, any
> Appsemble user account is able to log in to the app and will receive the default role.
`,
    },
    role: {
      type: 'string',
      description: `The default role to apply to members.

This must match with one of the roles defined within the security definition.
`,
    },
  },
};
