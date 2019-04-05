export default {
  description: 'A block definition response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/BlockVersion',
      },
    },
  },
};
