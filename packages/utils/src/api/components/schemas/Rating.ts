export default {
  type: 'object',
  description: 'A representation of an App rating.',
  additionalProperties: false,
  required: ['rating'],
  properties: {
    rating: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'A value ranging from 1 to 5 stars rating of the App.',
    },
    description: {
      type: 'string',
      description: 'An optional explanation of the given rating.',
    },
    name: {
      $ref: '#/components/schemas/User/properties/name',
      readOnly: true,
      description: 'The name of the user who submitted the rating.',
    },
  },
};
