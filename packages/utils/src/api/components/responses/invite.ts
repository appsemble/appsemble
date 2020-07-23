export default {
  description: 'An invite response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Organization',
      },
    },
  },
};
