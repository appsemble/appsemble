const { BasicAnnotationsReader } = require('ts-json-schema-generator');

module.exports = {
  root: true,
  extends: ['remcohaszing'],
  plugins: ['formatjs', 'vitest', 'appsemble'],
  settings: {
    node: {
      convertPath: {
        '**/*.ts': ['(.+)\\.ts$', '$1.js'],
      },
    },
  },
  rules: {
    'appsemble/enforce-index-decorator': 'error',
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
      files: ['packages/scripts/**'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'appsemble/enforce-index-decorator': 'error',
      },
    },
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
              'JSX.Element': 'Use ReactNode for React contexts and VNode for Preact contexts',
              ReactElement: { fixWith: 'ReactNode', message: 'Use ReactNode instead' },
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
      files: ['packages/server/migrations/**/*'],
      rules: {
        '@typescript-eslint/naming-convention': 'off',
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
      // https://github.com/remcohaszing/eslint-config-remcohaszing/blob/v8.0.1/vitest.js
      files: ['*.test.*'],
      extends: ['remcohaszing/dev'],
      rules: {
        'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
        'vitest/expect-expect': 'error',
        'vitest/no-alias-methods': 'error',
        'vitest/no-commented-out-tests': 'error',
        'vitest/no-conditional-expect': 'error',
        'vitest/no-disabled-tests': 'error',
        'vitest/no-done-callback': 'error',
        'vitest/no-focused-tests': 'error',
        'vitest/no-identical-title': 'error',
        'vitest/no-interpolation-in-snapshots': 'error',
        'vitest/no-mocks-import': 'error',
        'vitest/no-restricted-matchers': [
          'error',
          {
            resolves: 'Use expect(await) instead',
            'not.toHaveBeenCalledWith': 'Use not.toHaveBeenCalled() instead',
            'toBeFalsy()': 'Use toBe(false) instead.',
            'toBeTruthy()': 'Use toBe(true) instead.',
          },
        ],
        'vitest/no-standalone-expect': 'error',
        'vitest/no-test-return-statement': 'error',
        'vitest/prefer-called-with': 'error',
        'vitest/prefer-comparison-matcher': 'error',
        'vitest/prefer-each': 'error',
        'vitest/prefer-equality-matcher': 'error',
        'vitest/prefer-hooks-in-order': 'error',
        'vitest/prefer-hooks-on-top': 'error',
        'vitest/prefer-spy-on': 'error',
        'vitest/prefer-strict-equal': 'error',
        'vitest/prefer-to-be': 'error',
        'vitest/prefer-to-contain': 'error',
        'vitest/prefer-to-have-length': 'error',
        'vitest/prefer-todo': 'error',
        'vitest/require-to-throw-message': 'error',
        'vitest/valid-describe-callback': 'error',
        'vitest/valid-expect': 'error',
        'vitest/valid-title': 'error',
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
