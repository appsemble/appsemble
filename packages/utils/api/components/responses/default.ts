export default {
  description: 'The default error response.',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Error',
      },
    },
  },
};
