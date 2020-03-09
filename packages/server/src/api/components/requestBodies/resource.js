export default {
  description: 'A resource definition',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Resource',
      },
    },
  },
};
