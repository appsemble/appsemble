export default {
  description: 'A block definition',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/BlockDefinition',
      },
    },
  },
};
