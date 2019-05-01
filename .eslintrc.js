const path = require('path');

const { version } = require('react/package.json');
const restricted = require('eslint-restricted-globals');

const configs = [path.join(__dirname, 'config/**'), '*.config.js', '.*rc.js'];
const tests = ['**/*.test.{js,jsx}'];

module.exports = {
  root: true,
  extends: [
    'airbnb',
    'plugin:eslint-comments/recommended',
    'plugin:compat/recommended',
    'plugin:prettier/recommended',
    'prettier/react',
  ],
  parser: 'babel-eslint',
  plugins: ['babel', 'filenames'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    react: {
      version,
    },
  },
  rules: {
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
    'no-inline-comments': 'error',
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
    'filenames/match-regex': ['error', /^\.?[a-z]+(\.config|\.test)?$/i, true],
    'filenames/match-exported': 'error',
    'react/prefer-stateless-function': 'off',
    'no-invalid-this': 'off',
    'no-unused-expressions': 'off',
    'babel/no-invalid-this': 'error',
    'babel/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
    'babel/no-unused-expressions': 'error',
    'eslint-comments/no-unused-disable': 'error',
    'eslint-comments/no-use': ['error', { allow: ['eslint-disable-next-line'] }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: configs }],
    'import/order': [
      'error',
      {
        groups: ['builtin', ['external', 'internal'], ['index', 'sibling', 'parent']],
        'newlines-between': 'always',
      },
    ],
    'import/no-cycle': ['error', { maxDepth: 1 }],
    'import/no-useless-path-segments': 'error',
    'react/jsx-sort-props': 'error',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/label-has-for': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      rules: {
        'no-undef': 'off',
        'filenames/match-regex': ['error', /^\.?[a-z]+(\.config|\.test|\.d)?$/i, true],
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/class-name-casing': 'error',
        '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
        '@typescript-eslint/explicit-member-accessibility': 'error',
        '@typescript-eslint/interface-name-prefix': 'error',
        '@typescript-eslint/no-angle-bracket-type-assertion': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-object-literal-type-assertion': 'error',
        '@typescript-eslint/no-parameter-properties': 'error',
        '@typescript-eslint/no-triple-slash-reference': 'error',
        '@typescript-eslint/no-use-before-define': 'error',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-interface': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
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
          ...restricted.filter(r => r !== 'self'),
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
        'import/no-extraneous-dependencies': context => [
          'error',
          { devDependencies: true, packageDir: [context.getFilename(), __dirname] },
        ],
        'jest/consistent-test-it': ['error', { fn: 'it' }],
        'jest/expect-expect': 'error',
        'jest/no-alias-methods': 'error',
        'jest/no-disabled-tests': 'error',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-jasmine-globals': 'error',
        'jest/no-jest-import': 'error',
        'jest/no-test-callback': 'error',
        'jest/no-test-return-statement': 'error',
        'jest/no-truthy-falsy': 'error',
        'jest/prefer-to-be-null': 'error',
        'jest/prefer-to-be-undefined': 'error',
        'jest/prefer-to-contain': 'error',
        'jest/prefer-to-have-length': 'error',
        'jest/prefer-todo': 'error',
        'jest/prefer-spy-on': 'error',
        'jest/prefer-strict-equal': 'error',
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
        'react/jsx-filename-extension': 'off',
      },
    },
  ],
};
