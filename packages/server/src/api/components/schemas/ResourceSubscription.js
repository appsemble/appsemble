export default {
  type: 'object',
  properties: {
    create: { type: 'boolean' },
    update: { type: 'boolean' },
    delete: { type: 'boolean' },
    subscriptions: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { update: { type: 'boolean' }, delete: { type: 'boolean' } },
      },
    },
  },
};
