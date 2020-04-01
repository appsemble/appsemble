export default {
  name: 'resourceType',
  in: 'path',
  description: 'The type of the resource on which to perform an operation',
  required: true,
  schema: {
    type: 'string',
  },
};
