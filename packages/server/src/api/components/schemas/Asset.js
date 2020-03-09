export default {
  type: 'object',
  description: 'The response object of an asset create call.',
  properties: {
    id: {
      type: 'integer',
      readOnly: true,
      description: 'The unique identifier for the asset.',
    },
  },
};
