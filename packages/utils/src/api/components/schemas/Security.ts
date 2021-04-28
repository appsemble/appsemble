import { OpenAPIV3 } from 'openapi-types';

export const Security: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes how the app is secured.',
  required: ['default', 'roles'],
  properties: {
    default: {
      type: 'object',
      required: ['role'],
      description: 'The default role to apply to members.',
      properties: {
        policy: {
          type: 'string',
          enum: ['everyone', 'organization', 'invite'],
          default: 'everyone',
          description: `How the \`default\` role gets applied to users.

          The following values are allowed:
          - \`everyone\`: Every authenticated user gets the default role.
          - \`organization\`: Every authenticated user gets the default role if they are in the same organization as the app.
          - \`invite\`: The user has to manually get a role assigned.`,
        },

        role: {
          type: 'string',
          description: 'The default role to apply to members.',
        },
      },
    },
    roles: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'The description of the role.',
          },
          defaultPage: {
            $ref: '#/components/schemas/App/properties/definition/properties/defaultPage',
          },
          inherits: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};
