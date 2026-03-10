// Rules copied from https://github.com/remcohaszing/eslint/blob/v10.0.0/utils/react.js

import obsoleteHTMLElements from '../utils/obsoleteHTMLElements.js';

export default {
  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/boolean-prop-naming.md
   */
  'react/boolean-prop-naming': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/button-has-type.md
   */
  'react/button-has-type': {
    jsx: ['error', { button: true, submit: true, reset: false }],
    preact: ['error', { button: true, submit: true, reset: false }],
    react: ['error', { button: true, submit: true, reset: false }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/default-props-match-prop-types.md
   */
  'react/default-props-match-prop-types': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/destructuring-assignment.md
   */
  'react/destructuring-assignment': {
    jsx: 'off',
    preact: ['error', 'always', { ignoreClassFields: true }],
    react: ['error', 'always', { ignoreClassFields: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/display-name.md
   */
  'react/display-name': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-component-props.md
   */
  'react/forbid-component-props': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-dom-props.md
   */
  'react/forbid-dom-props': {
    jsx: ['error', { forbid: [{ propName: 'style', message: 'Use a CSS class instead' }] }],
    preact: ['error', { forbid: [{ propName: 'style', message: 'Use a CSS class instead' }] }],
    react: ['error', { forbid: [{ propName: 'style', message: 'Use a CSS class instead' }] }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-elements.md
   */
  'react/forbid-elements': {
    jsx: ['error', { forbid: obsoleteHTMLElements }],
    preact: ['error', { forbid: obsoleteHTMLElements }],
    react: ['error', { forbid: obsoleteHTMLElements }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-foreign-prop-types.md
   */
  'react/forbid-foreign-prop-types': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-prop-types.md
   */
  'react/forbid-prop-types': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/function-component-definition.md
   */
  'react/function-component-definition': {
    jsx: 'off',
    preact: [
      'error',
      { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
    ],
    react: [
      'error',
      { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
    ],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/hook-use-state.md
   */
  'react/hook-use-state': {
    jsx: 'off',
    preact: ['error', { allowDestructuredState: true }],
    react: ['error', { allowDestructuredState: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/iframe-missing-sandbox.md
   */
  'react/iframe-missing-sandbox': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-boolean-value.md
   */
  'react/jsx-boolean-value': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-child-element-spacing.md
   *
   * Prettier
   */
  'react/jsx-child-element-spacing': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-closing-bracket-location.md
   *
   * Prettier
   */
  'react/jsx-closing-bracket-location': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-closing-tag-location.md
   *
   * Prettier
   */
  'react/jsx-closing-tag-location': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-brace-presence.md
   */
  'react/jsx-curly-brace-presence': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-newline.md
   *
   * Prettier
   */
  'react/jsx-curly-newline': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-spacing.md
   *
   * Prettier
   */
  'react/jsx-curly-spacing': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-equals-spacing.md
   *
   * Prettier
   */
  'react/jsx-equals-spacing': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md
   */
  'react/jsx-filename-extension': {
    jsx: ['error', { allow: 'as-needed', extensions: ['.jsx', '.tsx'] }],
    preact: ['error', { allow: 'as-needed', extensions: ['.jsx', '.tsx'] }],
    react: ['error', { allow: 'as-needed', extensions: ['.jsx', '.tsx'] }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-first-prop-new-line.md
   *
   * Prettier
   */
  'react/jsx-first-prop-new-line': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-fragments.md
   *
   * Fragments are not supported libraries not being React in TypeScript.
   */
  'react/jsx-fragments': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-handler-names.md
   */
  'react/jsx-handler-names': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-indent.md
   *
   * Prettier
   */
  'react/jsx-indent': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-indent-props.md
   *
   * Prettier
   */
  'react/jsx-indent-props': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-key.md
   */
  'react/jsx-key': {
    jsx: 'off',
    preact: ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true }],
    react: ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-max-depth.md
   */
  'react/jsx-max-depth': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-max-props-per-line.md
   *
   * Prettier
   */
  'react/jsx-max-props-per-line': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-newline.md
   */
  'react/jsx-newline': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-bind.md
   */
  'react/jsx-no-bind': {
    jsx: 'off',
    preact: ['error', { allowArrowFunctions: true, ignoreRefs: true }],
    react: ['error', { allowArrowFunctions: true, ignoreRefs: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-comment-textnodes.md
   */
  'react/jsx-no-comment-textnodes': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-constructed-context-values.md
   */
  'react/jsx-no-constructed-context-values': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-duplicate-props.md
   */
  'react/jsx-no-duplicate-props': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-literals.md
   */
  'react/jsx-no-literals': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-leaked-render.md
   */
  'react/jsx-no-leaked-render': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-script-url.md
   */
  'react/jsx-no-script-url': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-target-blank.md
   */
  'react/jsx-no-target-blank': {
    jsx: ['error', { forms: true }],
    preact: ['error', { forms: true }],
    react: ['error', { forms: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-undef.md
   */
  'react/jsx-no-undef': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-useless-fragment.md
   */
  'react/jsx-no-useless-fragment': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-one-expression-per-line.md
   *
   * Prettier
   */
  'react/jsx-one-expression-per-line': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
   */
  'react/jsx-pascal-case': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-multi-spaces.md
   *
   * Prettier
   */
  'react/jsx-props-no-multi-spaces': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-spreading.md
   */
  'react/jsx-props-no-spreading': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-default-props.md
   *
   * @deprecated
   */
  'react/jsx-sort-default-props': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md
   */
  'react/jsx-sort-props': {
    jsx: ['error', { ignoreCase: true }],
    preact: ['error', { ignoreCase: true }],
    react: ['error', { ignoreCase: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-space-before-closing.md
   *
   * @deprecated
   */
  'react/jsx-space-before-closing': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-tag-spacing.md
   *
   * Prettier
   */
  'react/jsx-tag-spacing': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-uses-react.md
   */
  'react/jsx-uses-react': {
    jsx: 'error',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-uses-vars.md
   */
  'react/jsx-uses-vars': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-wrap-multilines.md
   *
   * Prettier
   */
  'react/jsx-wrap-multilines': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-access-state-in-setstate.md
   */
  'react/no-access-state-in-setstate': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-adjacent-inline-elements.md
   */
  'react/no-adjacent-inline-elements': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-array-index-key.md
   */
  'react/no-array-index-key': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-arrow-function-lifecycle.md
   */
  'react/no-arrow-function-lifecycle': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-children-prop.md
   */
  'react/no-children-prop': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-danger.md
   */
  'react/no-danger': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-danger-with-children.md
   */
  'react/no-danger-with-children': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-deprecated.md
   */
  'react/no-deprecated': {
    jsx: 'off',
    preact: 'off',
    react: 'warn',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-did-mount-set-state.md
   */
  'react/no-did-mount-set-state': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-did-update-set-state.md
   */
  'react/no-did-update-set-state': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-direct-mutation-state.md
   */
  'react/no-direct-mutation-state': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-find-dom-node.md
   */
  'react/no-find-dom-node': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-is-mounted.md
   */
  'react/no-is-mounted': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-invalid-html-attribute.md
   */
  'react/no-invalid-html-attribute': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-multi-comp.md
   *
   * Disabled because of https://github.com/yannickcr/eslint-plugin-react/issues/2842
   */
  'react/no-multi-comp': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-namespace.md
   */
  'react/no-namespace': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-object-type-as-default-prop.md
   */
  'react/no-object-type-as-default-prop': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-redundant-should-component-update.md
   */
  'react/no-redundant-should-component-update': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-render-return-value.md
   */
  'react/no-render-return-value': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-set-state.md
   */
  'react/no-set-state': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-string-refs.md
   */
  'react/no-string-refs': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-this-in-sfc.md
   */
  'react/no-this-in-sfc': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-typos.md
   */
  'react/no-typos': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unescaped-entities.md
   */
  'react/no-unescaped-entities': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
   */
  'react/no-unknown-property': {
    jsx: 'off',
    preact: ['error', { ignore: ['class'] }],
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unsafe.md
   */
  'react/no-unsafe': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unused-class-component-methods.md
   */
  'react/no-unused-class-component-methods': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unused-prop-types.md
   */
  'react/no-unused-prop-types': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unused-state.md
   */
  'react/no-unused-state': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-will-update-set-state.md
   */
  'react/no-will-update-set-state': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-es6-class.md
   */
  'react/prefer-es6-class': {
    jsx: 'off',
    preact: 'off',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-exact-props.md
   */
  'react/prefer-exact-props': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-read-only-props.md
   */
  'react/prefer-read-only-props': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-stateless-function.md
   */
  'react/prefer-stateless-function': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prop-types.md
   */
  'react/prop-types': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/react-in-jsx-scope.md
   */
  'react/react-in-jsx-scope': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/require-default-props.md
   */
  'react/require-default-props': {
    jsx: 'off',
    preact: ['error', { forbidDefaultForRequired: true, ignoreFunctionalComponents: true }],
    react: ['error', { forbidDefaultForRequired: true, ignoreFunctionalComponents: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/require-optimization.md
   */
  'react/require-optimization': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/require-render-return.md
   */
  'react/require-render-return': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/self-closing-comp.md
   */
  'react/self-closing-comp': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/sort-comp.md
   */
  'react/sort-comp': {
    jsx: 'off',
    preact: 'error',
    react: [
      'error',
      {
        order: [
          'static-variables',
          'type-annotations',
          'instance-variables',
          'static-methods',
          'lifecycle',
          'instance-methods',
          'everything-else',
          'render',
        ],
      },
    ],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/sort-default-props.md
   */
  'react/sort-default-props': {
    jsx: ['off', { ignoreCase: true }],
    preact: ['error', { ignoreCase: true }],
    react: ['error', { ignoreCase: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/sort-prop-types.md
   */
  'react/sort-prop-types': {
    jsx: ['off', { ignoreCase: true }],
    preact: ['error', { ignoreCase: true }],
    react: ['error', { ignoreCase: true }],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/state-in-constructor.md
   */
  'react/state-in-constructor': {
    jsx: 'off',
    preact: ['error', 'never'],
    react: ['error', 'never'],
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/static-property-placement.md
   */
  'react/static-property-placement': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/style-prop-object.md
   */
  'react/style-prop-object': {
    jsx: 'off',
    preact: 'off',
    react: 'off',
  },

  /**
   * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/void-dom-elements-no-children.md
   */
  'react/void-dom-elements-no-children': {
    jsx: 'error',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
   */
  'react-hooks/rules-of-hooks': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },

  /**
   * https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
   */
  'react-hooks/exhaustive-deps': {
    jsx: 'off',
    preact: 'error',
    react: 'error',
  },
};
