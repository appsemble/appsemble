export default {
  description: 'A user profile',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          name: {
            $ref: '#/components/schemas/User/properties/name',
          },
          primaryEmail: {
            $ref: '#/components/schemas/User/properties/primaryEmail',
          },
        },
        additionalProperties: true,
      },
    },
  },
};
