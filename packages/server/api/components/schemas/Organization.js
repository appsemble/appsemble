export default {
  type: 'object',
  description: 'An organization groups a set of users, apps, themes, and permissions together',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      pattern: /^[a-z\d]([a-z\d-]{0,30}[a-z\d])$/,
      description: 'The unique identifier for the organization.',
    },
    name: {
      type: 'string',
      description: 'The display name for the organization.',
    },
  },
};
