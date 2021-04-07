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
        'src/**': ['src/(.+?).ts$', 'dist/$1.js'],
      },
    },
  },
  rules: {
    camelcase: ['error', { properties: 'never' }],

    'jest/no-restricted-matchers': 'off',

    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-tag-names': [
      'error',
      { definedTags: ['format', 'maximum', 'minimum', 'TJS-pattern', 'TJS-type'], jsxTags: true },
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
              Context: {
                message:
                  'The builtin Koa Context type is too loose. Use the custom KoaContext instead.',
                fixWith: 'KoaContext',
              },
              Middleware: {
                message:
                  'The builtin Koa Middleware type is too loose. Use the custom KoaMiddleware instead.',
                fixWith: 'KoaMiddleware',
              },
            },
          },
        ],
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-shadow': ['error', { hoist: 'functions' }],

        // https://github.com/JedWatson/classnames/pull/232
        'import/no-named-as-default': 'off',

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
      files: ['**/*.md/*.js'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};
