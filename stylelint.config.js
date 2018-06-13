module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
  ],
  rules: {
    'color-hex-length': 'long',
    'color-named': 'never',
    'string-quotes': 'single',
    'value-keyword-case': 'lower',
    'font-family-no-missing-generic-family-keyword': null,
  },
};
