const path = require('path');
const restricted = require('eslint-restricted-globals');

const configs = [
  path.join(__dirname, 'config/**'),
  '*.config.js',
  '.*rc.js',
  '**/jest.setup.ts',
  '**/__mocks__/**',
];
const tests = ['**/*.test.{js,ts,tsx}'];

module.exports = {
  root: true,
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:eslint-comments/recommended',
    'plugin:compat/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'prettier/react',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ['filenames', 'simple-import-sort', 'sort-destructure-keys'],
  settings: {
    'import/resolver': {
      typescript: {
        directory: ['./blocks/*/tsconfig.json', './packages/*/tsconfig.json', './tsconfig.json'],
      },
    },
  },
  rules: {
    curly: ['error', 'all'],
    'max-len': [
      'error',
      {
        code: 100,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-arrow-callback': 'error',
    'no-await-in-loop': 'off',
    'no-inline-comments': 'error',
    'no-implicit-coercion': 'error',
    'no-restricted-syntax': 'off',
    'filenames/match-regex': ['error', /^\.?[a-z\d]+(\.config|\.test)?$/i, true],
    'filenames/match-exported': 'error',
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
    'eslint-comments/no-unused-disable': 'error',
    'eslint-comments/no-use': ['error', { allow: ['eslint-disable-next-line'] }],
    'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never', tsx: 'never' }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: [...configs, ...tests] }],
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external', 'internal'],
          ['index', 'sibling', 'parent'],
        ],
        'newlines-between': 'always',
      },
    ],
    'import/no-cycle': 'off',
    'react/jsx-filename-extension': 'off',
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-sort-props': 'error',
    'react/react-in-jsx-scope': 'off',
    'simple-import-sort/sort': 'error',
    'sort-destructure-keys/sort-destructure-keys': 'error',
    'jsx-a11y/label-has-associated-control': 'off',

    // These rules are related to AirBnB not supporting static class properties.
    'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
    'react/static-property-placement': ['error', 'static public field'],
    'react/state-in-constructor': ['error', 'never'],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'no-unused-expressions': 'off',

        'filenames/match-regex': ['error', /^\.?[a-z\d]+(\.config|\.setup|\.test|\.d)?$/i, true],
        'import/no-unresolved': 'off',
        'react/no-unknown-property': 'off',
        'react/prop-types': 'off',
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-types': [
          'error',
          {
            types: {
              'JSX.Element':
                'Use React.ReactElement for React contexts and VNode for Preact contexts',
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
        '@typescript-eslint/class-name-casing': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
        '@typescript-eslint/interface-name-prefix': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-parameter-properties': 'error',
        '@typescript-eslint/no-use-before-define': 'error',
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
      },
    },
    {
      files: ['packages/server/src/migrations/**'],
      rules: {
        'filenames/match-regex': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        'filenames/match-regex': 'off',
        'max-classes-per-file': 'off',
        'no-useless-constructor': 'off',
      },
    },
    {
      files: ['**/service-worker/**'],
      env: {
        browser: false,
        serviceworker: true,
        worker: true,
      },
      globals: {
        // This is injected in the service worker by serviceworker-webpack-plugin
        serviceWorkerOption: false,
      },
      rules: {
        // 'self' refers to the global object in service workers, so the same restricted globals
        // are used as in eslint-config-airbnb, except 'self' is allowed.
        'no-restricted-globals': [
          'error',
          'isFinite',
          'isNaN',
          ...restricted.filter((r) => r !== 'self'),
        ],
      },
    },
    {
      files: tests,
      plugins: ['jest'],
      env: {
        jest: true,
      },
      rules: {
        // We don’t need browser compatibility checks on our tests.
        'compat/compat': 'off',
        'jest/consistent-test-it': ['error', { fn: 'it' }],
        'jest/expect-expect': 'error',
        'jest/no-alias-methods': 'error',
        'jest/no-commented-out-tests': 'error',
        'jest/no-disabled-tests': 'error',
        'jest/no-expect-resolves': 'error',
        'jest/no-export': 'error',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-if': 'error',
        'jest/no-jasmine-globals': 'error',
        'jest/no-jest-import': 'error',
        'jest/no-test-callback': 'error',
        'jest/no-test-return-statement': 'error',
        'jest/no-try-expect': 'error',
        'jest/prefer-to-be-null': 'error',
        'jest/prefer-to-be-undefined': 'error',
        'jest/prefer-to-contain': 'error',
        'jest/prefer-to-have-length': 'error',
        'jest/prefer-todo': 'error',
        'jest/prefer-spy-on': 'error',
        'jest/prefer-strict-equal': 'error',
        'jest/require-to-throw-message': 'error',
        'jest/valid-describe': 'error',
        'jest/valid-expect-in-promise': 'error',
        'jest/valid-expect': 'error',
      },
    },
    {
      files: ['*.md'],
      plugins: ['markdown'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'prettier/prettier': 'off',
      },
    },
  ],
};
