module.exports = {
  root: true,
  extends: ['plugin:compat/recommended', 'remcohaszing', 'remcohaszing/jest'],
  settings: {
    'import/external-module-folders': ['node_modules', 'node_modules/@types'],
    'import/resolver': {
      typescript: {
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
    'no-restricted-properties': [
      'error',
      { property: 'prototype', message: 'Use a class instead.' },
    ],
    'no-restricted-syntax': [
      'error',
      {
        // `${value}`
        selector:
          'TemplateLiteral[expressions.length=1][quasis.0.value.raw=""][quasis.1.value.raw=""]',
        message: 'Use String() instead.',
      },
      {
        // `value.toString()`
        selector: 'CallExpression[callee.property.name="toString"][arguments.length=0]',
        message: 'Use String() instead.',
      },
      {
        selector: 'SequenceExpression',
        message: 'Split this sequence into multiple statements.',
      },
    ],
    'no-shadow': ['error', { hoist: 'functions' }],
    'require-atomic-updates': 'off',
    'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],

    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-tag-names': [
      'error',
      { definedTags: ['format', 'maximum', 'minimum', 'TJS-pattern', 'TJS-type'] },
    ],

    'node/no-unsupported-features/es-builtins': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unsupported-features/node-builtins': 'off',

    'unicorn/no-unsafe-regex': 'off',
    'unicorn/prefer-replace-all': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      settings: {
        'import/external-module-folders': ['node_modules', 'node_modules/@types'],
      },
      rules: {
        'new-cap': 'off',

        'import/default': 'off',
        'import/named': 'off',
        'import/no-named-as-default': 'off',
        'import/no-unresolved': 'off',

        '@typescript-eslint/ban-types': [
          'error',
          {
            extendDefaults: false,
            types: {
              'JSX.Element': 'Use ReactElement for React contexts and VNode for Preact contexts',
              Record: 'Use a mapped type instead',
              ComponentProps: {
                message: 'Use ComponentPropsWithoutRef instead',
                fixWith: 'ComponentPropsWithoutRef',
              },
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
        '@typescript-eslint/no-dynamic-delete': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-type-alias': 'off',
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
  ],
};
