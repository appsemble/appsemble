module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
  ],
  plugins: [
    'stylelint-no-unsupported-browser-features',
  ],
  rules: {
    'color-hex-length': 'long',
    'color-named': 'never',
    'string-quotes': 'single',
    'value-keyword-case': 'lower',
    'font-family-no-missing-generic-family-keyword': null,
    'selector-max-specificity': ['0,1,0', { ignoreSelectors: [':global'] }],
    'plugin/no-unsupported-browser-features': true,
  },
};
