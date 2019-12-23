export default {
  type: 'object',
  description: 'This describes what a sub page will look like in the app.',
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
          enum: ['anyone', 'organization', 'invite'],
          default: 'anyone',
          description: `How the \`default\` role gets applied to users.

          If set to ‘anyone’: Every authenticated user gets the default role.
          If set to ‘organization’: Every authenticated user gets the default role if they are in the same organization as the app.
          If set to ‘invite’: The user has to manually get a role assigned.`,
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
