export default {
  type: 'object',
  description: 'A health check status',
  readOnly: true,
  properties: {
    database: {
      type: 'boolean',
      description: 'Whether or not the database status is healthy',
    },
  },
};
