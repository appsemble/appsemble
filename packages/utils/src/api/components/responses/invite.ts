export default {
  description: 'An invite response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          $ref: '#/components/schemas/Organization',
        },
      },
    },
  },
};
