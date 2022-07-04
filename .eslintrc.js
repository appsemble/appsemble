const { BasicAnnotationsReader } = require('ts-json-schema-generator');

module.exports = {
  root: true,
  extends: ['remcohaszing', 'remcohaszing/jest'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json'],
      },
    },
    node: {
      convertPath: {
        '**/*.ts': ['(.+)\\.ts$', '$1.js'],
        '**/*.tsx': ['(.+)\\.tsx$', '$1.js'],
      },
    },
  },
  rules: {
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-tag-names': [
      'error',
      { definedTags: [...BasicAnnotationsReader.textTags, ...BasicAnnotationsReader.jsonTags] },
    ],

    'unicorn/consistent-destructuring': 'off',
    'unicorn/no-unsafe-regex': 'off',
    'unicorn/prefer-spread': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/ban-types': [
          'error',
          {
            extendDefaults: false,
            types: {
              'JSX.Element': 'Use ReactElement for React contexts and VNode for Preact contexts',
            },
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-shadow': ['error', { hoist: 'functions' }],

        'unicorn/prefer-array-flat': 'off',
      },
    },
    {
      files: ['packages/create-appsemble/templates/**'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',

        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/__fixtures__/**'],
      rules: {
        'import/no-extraneous-dependencies': 'off',

        'node/no-extraneous-import': 'off',
      },
    },
    {
      files: ['**/*.md/*.js', '**/*.md/*.ts', '**/*.md/*.tsx'],
      rules: {
        'no-undef': 'off',

        'import/no-extraneous-dependencies': 'off',

        'node/no-extraneous-import': 'off',
      },
    },
  ],
};
