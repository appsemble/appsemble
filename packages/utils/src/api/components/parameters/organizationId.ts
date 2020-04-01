export default {
  name: 'organizationId',
  in: 'path',
  description: 'The ID of the organization on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/Organization/properties/id' },
};
