export default {
  type: 'object',
  description: 'This describes what a sub page will look like in the app.',
  required: ['name', 'blocks'],
  properties: {
    name: {
      type: 'string',
      maxLength: 50,
      description: `The name of the page.

        This will be displayed on the top of the page and in the side menu.
      `,
    },
    blocks: {
      type: 'array',
      minItems: 1,
      description: 'The blocks that make up a page.',
      items: {
        $ref: '#/components/schemas/Block',
      },
    },
  },
};
