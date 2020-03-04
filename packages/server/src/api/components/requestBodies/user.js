export default {
  description: 'A user profile',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/User',
      },
    },
  },
};
