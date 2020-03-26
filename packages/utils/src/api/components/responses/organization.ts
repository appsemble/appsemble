export default {
  description: 'An organization response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Organization',
      },
    },
  },
};
