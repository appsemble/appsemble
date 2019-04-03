export default {
  description: 'An app response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/App',
      },
    },
  },
};
