export default {
  type: 'object',
  description: 'A definition for a block.',
  properties: {
    id: {
      type: 'string',
      description: `The id of a block.

        This uses the same form as scoped npm packages. For example, \`@appsemble/form\`.
      `,
      pattern: /^@[a-z]([a-z\d-]{0,30}[a-z\d])?\/[a-z]([a-z\d-]{0,30}[a-z\d])$/,
    },
    description: {
      type: 'string',
      description: `A human readable description of the block.

        This should be used to give app builders an indication of what the block does.

        The [CommonMark](https://commonmark.org) Markdown format is allowed.
      `,
    },
  },
};
