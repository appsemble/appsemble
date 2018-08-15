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
    'markdown',
  ],
  env: {
    jest: true,
  },
  rules: {
    'react/prefer-stateless-function': 'off',
    'no-invalid-this': 'off',
    semi: 'off',
    'babel/no-invalid-this': 'error',
    'babel/semi': 'error',
    'eslint-comments/no-unused-disable': 'error',
  },
};
