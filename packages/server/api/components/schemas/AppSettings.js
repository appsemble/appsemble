import { normalized } from '@appsemble/utils';

export default {
  type: 'object',
  description: 'The settings of an app.',
  properties: {
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
      format: 'binary',
      description: 'The app icon.',
    },
  },
};
