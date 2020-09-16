module.exports = {
  root: true,
  extends: ['remcohaszing', 'remcohaszing/jest'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./blocks/*/tsconfig.json', './packages/*/tsconfig.json', './tsconfig.json'],
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
    'no-shadow': ['error', { hoist: 'functions' }],

    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-tag-names': [
      'error',
      { definedTags: ['format', 'maximum', 'minimum', 'TJS-pattern', 'TJS-type'] },
    ],

    'unicorn/no-unsafe-regex': 'off',
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
              Record: 'Use a mapped type instead',
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

        'node/no-unsupported-features/es-syntax': 'off',
      },
    },
    {
      files: ['**/__mocks__/**', '*.test.*', 'jest.*'],
      rules: {
        // We don’t need browser compatibility checks on our tests.
        'compat/compat': 'off',
        'node/no-unpublished-import': 'off',
      },
    },
    {
      files: ['packages/create-appsemble/templates/**'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['**/*.config.*', '**/jest.setup.ts', '**/*.test.*'],
      extends: ['remcohaszing/dev'],
    },
  ],
};
