/* eslint-disable import/no-extraneous-dependencies */
const { version } = require('react/package.json');
const restricted = require('eslint-restricted-globals');
/* eslint-enable import/no-extraneous-dependencies */

module.exports = {
  root: true,
  extends: [
    'airbnb',
    'plugin:eslint-comments/recommended',
    'plugin:compat/recommended',
    'plugin:prettier/recommended',
  ],
  parser: 'babel-eslint',
  plugins: ['babel', 'filenames'],
  settings: {
    react: {
      version,
    },
  },
  rules: {
    'filenames/match-regex': ['error', /^\.?[a-z]+(\.config|\.test)?$/i, true],
    'filenames/match-exported': 'error',
    'react/prefer-stateless-function': 'off',
    'no-invalid-this': 'off',
    'no-unused-expressions': 'off',
    'babel/no-invalid-this': 'error',
    'babel/no-unused-expressions': 'error',
    'eslint-comments/no-unused-disable': 'error',
    'react/jsx-sort-props': 'error',
  },
  overrides: [
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
      files: ['*.test.{js,jsx}'],
      plugins: ['jest'],
      env: {
        jest: true,
      },
      rules: {
        'jest/consistent-test-it': [
          'error',
          {
            fn: 'it',
          },
        ],
        'jest/expect-expect': 'error',
        'jest/no-disabled-tests': 'error',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-jasmine-globals': 'error',
        'jest/no-jest-import': 'error',
        'jest/no-test-return-statement': 'error',
        'jest/prefer-to-be-null': 'error',
        'jest/prefer-to-be-undefined': 'error',
        'jest/prefer-to-have-length': 'error',
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
