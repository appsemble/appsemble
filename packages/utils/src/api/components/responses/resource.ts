export default {
  description: 'A resource response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Resource',
      },
    },
    'text/csv': {
      schema: {
        type: 'string',
      },
    },
  },
};
