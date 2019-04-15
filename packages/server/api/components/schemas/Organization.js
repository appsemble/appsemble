export default {
  type: 'object',
  description: 'An organization groups a set of users, apps, themes, and permissions together',
  properties: {
    id: {
      type: 'string',
      pattern: /^[a-z]([a-z\d-]{0,30}[a-z\d])$/,
      readOnly: true,
      description: 'The unique identifier for the organization.',
    },
  },
};
