module.exports = {
  root: true,
  extends: [
    'airbnb',
    'plugin:eslint-comments/recommended',
    'plugin:compat/recommended',
  ],
  parser: 'babel-eslint',
  plugins: [
    'babel',
    'filenames',
  ],
  rules: {
    'filenames/match-regex': ['error', /^\.?[a-z]+(\.config|\.test)?$/i, true],
    'filenames/match-exported': 'error',
    'react/prefer-stateless-function': 'off',
    'no-invalid-this': 'off',
    semi: 'off',
    'babel/no-invalid-this': 'error',
    'babel/semi': 'error',
    'eslint-comments/no-unused-disable': 'error',
  },
  overrides: [
    {
      files: ['*.test.{js,jsx}'],
      plugins: [
        'jest',
      ],
      env: {
        jest: true,
      },
      rules: {
        'jest/consistent-test-it': ['error', { fn: 'it' }],
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
      plugins: [
        'markdown',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'react/jsx-filename-extension': 'off',
      },
    },
  ],
};
