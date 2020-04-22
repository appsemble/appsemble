export default {
  type: 'object',
  description: 'The response object of an asset create call.',
  properties: {
    id: {
      type: 'integer',
      readOnly: true,
      description: 'The unique identifier for the asset.',
    },
    mime: {
      type: 'string',
      readOnly: true,
      description: 'The IANA MIME type of the asset.',
    },
    filename: {
      type: 'string',
      readOnly: true,
      description: 'The filename of the asset.',
    },
  },
};
