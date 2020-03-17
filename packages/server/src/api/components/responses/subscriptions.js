export default {
  description: 'A subscription response.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/ResourceSubscription',
        },
      },
    },
  },
};
