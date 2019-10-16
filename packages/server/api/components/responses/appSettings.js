export default {
  description: 'An app settings response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/AppSettings',
      },
    },
  },
};
