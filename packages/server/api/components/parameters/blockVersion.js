export default {
  name: 'blockVersion',
  in: 'path',
  description: 'The version of the block on which to perform an operation.',
  required: true,
  schema: { $ref: '#/components/schemas/BlockVersion/properties/version' },
};
