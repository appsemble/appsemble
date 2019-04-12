export default {
  name: 'blockId',
  in: 'path',
  description:
    'The ID of the block on which to perform an operation, but without the organization scope.',
  required: true,
  schema: {
    type: 'string',
    pattern: /^[a-z]([a-z\d-]{0,30}[a-z\d])$/,
  },
};
