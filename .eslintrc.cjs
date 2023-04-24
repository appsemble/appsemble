const { BasicAnnotationsReader } = require('ts-json-schema-generator');

module.exports = {
  root: true,
  extends: ['remcohaszing'],
  plugins: ['jest'],
  settings: {
    node: {
      convertPath: {
        '**/*.ts': ['(.+)\\.ts$', '$1.js'],
      },
    },
  },
  rules: {
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-tag-names': [
      'error',
      { definedTags: [...BasicAnnotationsReader.textTags, ...BasicAnnotationsReader.jsonTags] },
    ],

    'n/prefer-global/process': 'off',

    'unicorn/consistent-destructuring': 'off',
    'unicorn/expiring-todo-comments': 'off',
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
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/__fixtures__/**'],
      rules: {
        'import/no-extraneous-dependencies': 'off',

        'n/no-extraneous-import': 'off',
      },
    },
    {
      files: ['**/*.md/*.js', '**/*.md/*.ts', '**/*.md/*.tsx'],
      rules: {
        'no-undef': 'off',

        'import/no-extraneous-dependencies': 'off',

        'n/no-extraneous-import': 'off',
      },
    },
    {
      // https://github.com/remcohaszing/eslint-config-remcohaszing/blob/v8.0.1/jest.js
      files: ['*.test.*'],
      extends: ['remcohaszing/dev'],
      env: {
        'jest/globals': true,
      },
      rules: {
        'jest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
        'jest/expect-expect': 'error',
        'jest/no-alias-methods': 'error',
        'jest/no-commented-out-tests': 'error',
        'jest/no-conditional-expect': 'error',
        'jest/no-deprecated-functions': 'error',
        'jest/no-disabled-tests': 'error',
        'jest/no-done-callback': 'error',
        'jest/no-export': 'error',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-interpolation-in-snapshots': 'error',
        'jest/no-jasmine-globals': 'error',
        'jest/no-mocks-import': 'error',
        'jest/no-restricted-matchers': [
          'error',
          {
            resolves: 'Use expect(await) instead',
            'not.toHaveBeenCalledWith': 'Use not.toHaveBeenCalled() instead',
            'toBeFalsy()': 'Use toBe(false) instead.',
            'toBeTruthy()': 'Use toBe(true) instead.',
          },
        ],
        'jest/no-standalone-expect': 'error',
        'jest/no-test-return-statement': 'error',
        'jest/prefer-called-with': 'error',
        'jest/prefer-comparison-matcher': 'error',
        'jest/prefer-each': 'error',
        'jest/prefer-equality-matcher': 'error',
        'jest/prefer-hooks-in-order': 'error',
        'jest/prefer-hooks-on-top': 'error',
        'jest/prefer-spy-on': 'error',
        'jest/prefer-strict-equal': 'error',
        'jest/prefer-to-be': 'error',
        'jest/prefer-to-contain': 'error',
        'jest/prefer-to-have-length': 'error',
        'jest/prefer-todo': 'error',
        'jest/require-to-throw-message': 'error',
        'jest/valid-describe-callback': 'error',
        'jest/valid-expect': 'error',
        'jest/valid-title': 'error',
        'jest-formatting/padding-around-after-all-blocks': 'error',
        'jest-formatting/padding-around-after-each-blocks': 'error',
        'jest-formatting/padding-around-before-all-blocks': 'error',
        'jest-formatting/padding-around-before-each-blocks': 'error',
        'jest-formatting/padding-around-describe-blocks': 'error',
        'jest-formatting/padding-around-test-blocks': 'error',
      },
    },
  ],
};
