import { OpenAPIV3 } from 'openapi-types';

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
- \`invite\`: The user has to manually get a role assigned.
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
