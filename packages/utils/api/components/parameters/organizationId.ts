export const organizationId = {
  name: 'organizationId',
  required: true,
  in: 'path',
  description: 'The ID of the organization on which to perform an operation',
  schema: { $ref: '#/components/schemas/Organization/properties/id' },
};
