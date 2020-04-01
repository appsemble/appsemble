export default {
  name: 'resourceId',
  in: 'path',
  description: 'The ID of the resource on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/Resource/properties/id' },
};
