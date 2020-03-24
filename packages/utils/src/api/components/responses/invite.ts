export default {
  description: 'An invite response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          organization: {
            $ref: '#/components/schemas/Organization',
          },
        },
      },
    },
  },
};
