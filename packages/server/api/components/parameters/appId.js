export default {
  name: 'appId',
  in: 'path',
  description: 'The ID of the app on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/App/properties/id' },
};
