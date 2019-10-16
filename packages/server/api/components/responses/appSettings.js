import { normalized } from '@appsemble/utils';

export default {
  description: 'An app response',
  content: {
    'application/json': {
      schema: {
        path: {
          type: 'string',
          minLength: 1,
          maxLength: 30,
          pattern: normalized,
          description: `The URL path segment on which this app is reachable.

            This may only contain lower case characters, numbers, and hyphens. By default this is a
            normalized version of the app name.
          `,
        },
        private: {
          type: 'boolean',
          description: 'Determines whether this app should be included when fetching all apps.',
        },
        icon: {
          type: 'string',
          description: 'The url of the icon as it was originally uploaded.',
        },
      },
    },
  },
};
