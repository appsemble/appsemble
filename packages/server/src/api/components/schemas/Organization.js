import { normalized } from '@appsemble/utils';

export default {
  type: 'object',
  description: 'An organization groups a set of users, apps, themes, and permissions together',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      pattern: normalized,
      minLength: 1,
      maxLength: 30,
      description: 'The unique identifier for the organization.',
    },
    name: {
      type: 'string',
      description: 'The display name for the organization.',
    },
  },
};
