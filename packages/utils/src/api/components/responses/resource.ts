export default {
  description: 'A resource response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Resource',
      },
    },
  },
};
