module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
    'stylelint-prettier/recommended',
  ],
  plugins: [
    'stylelint-color-format',
    'stylelint-no-unsupported-browser-features',
    'stylelint-order',
  ],
  rules: {
    // Enforce clean font family definitions.
    'font-family-no-duplicate-names': true,
    'font-family-no-missing-generic-family-keyword': true,

    // Force consistant use of quotes.
    'font-family-name-quotes': 'always-unless-keyword',
    'function-url-quotes': 'never',

    // Enforce the use of HSL colors.
    'color-named': 'never',
    'color-format/format': { format: 'hsl' },

    // Disallow vendor prefixes.
    'at-rule-no-vendor-prefix': true,
    'media-feature-name-no-vendor-prefix': true,
    'property-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,

    // Use relative URLs.
    'function-url-no-scheme-relative': true,

    // Check for undefined animations.
    'no-unknown-animations': true,
    'value-keyword-case': 'lower',

    // Force consistent shorthand properties.
    'declaration-block-no-redundant-longhand-properties': true,
    'shorthand-property-no-redundant-values': true,

    // Limit the maximum selector specificity.
    'selector-max-attribute': [0, { ignoreAttributes: ['disabled', 'name', 'rows', 'type'] }],
    'selector-max-class': 3,
    'selector-max-compound-selectors': 3,
    'selector-max-id': 0,
    'selector-max-type': 1,
    'selector-max-universal': 1,

    // Enforce consistent sorting.
    'order/order': ['declarations', 'at-rules', 'rules'],
    'order/properties-alphabetical-order': true,

    // Make sure our CSS works in older browsers.
    'plugin/no-unsupported-browser-features': true,
  },
};
