export default {
  type: 'object',
  description: 'An object representing a user.',
  additionalProperties: false,
  properties: {
    id: {
      type: 'number',
      mininum: 0,
      readOnly: true,
      description: 'The ID of the user.',
    },
    name: {
      type: 'string',
      description: 'The display name of the user.',
    },
    primaryEmail: {
      type: 'string',
      description: 'The primary email used for communication.',
    },
    organizations: {
      type: 'array',
      description: 'The organizations this user is a part of.',
      items: {
        $ref: '#/components/schemas/Organization',
      },
    },
  },
};
