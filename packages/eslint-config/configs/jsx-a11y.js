import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig } from 'eslint/config';

import rules from '../rules/jsx-a11y.js';
import { getReactRules } from '../utils/getReactRules.js';

export default defineConfig([
  {
    files: ['*.jsx', '*.tsx'],
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: '999',
        pragma: undefined,
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...rules,
      ...getReactRules('jsx'),
    },
  },
]);
