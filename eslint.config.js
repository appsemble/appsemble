import config from '@appsemble/eslint-config';

export default [
  ...config,
  {
    files: ['packages/appsemble-language-server/**/*.{js,ts}'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'n/hashbang': 'off',
      'no-console': 'off',
    },
  },
];
