module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
    'stylelint-config-prettier',
  ],
  plugins: ['stylelint-no-unsupported-browser-features', 'stylelint-order'],
  rules: {
    'color-hex-length': 'long',
    'color-named': 'never',
    'string-quotes': 'single',
    'value-keyword-case': 'lower',
    'font-family-no-missing-generic-family-keyword': null,
    'selector-max-specificity': ['0,1,0', { ignoreSelectors: [':global'] }],
    'order/order': ['declarations', 'at-rules', 'rules'],
    'order/properties-alphabetical-order': true,
    'plugin/no-unsupported-browser-features': true,
  },
};
