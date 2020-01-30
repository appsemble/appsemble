export default {
  type: 'object',
  description: 'This describes how the app is secured.',
  required: ['default', 'roles'],
  properties: {
    default: {
      type: 'object',
      required: ['role'],
      description:
        'The default role to apply to members. The implication of this depends on the `who` property.',
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
          description:
            'The default role to apply to members. The implication of this depends on the `who` property.',
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
