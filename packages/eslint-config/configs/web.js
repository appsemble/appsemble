import { defineConfig } from 'eslint/config';
import n from 'eslint-plugin-n';
import compat from 'eslint-plugin-compat';

export default defineConfig([
  {
    plugins: {
      compat,
      n,
    },
    rules: {
      /**
       * https://github.com/amilajack/eslint-plugin-compat
       */
      'compat/compat': 'error',

      /**
       * https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-deprecated-api.md
       */
      'n/no-deprecated-api': 'off',

      /**
       * https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-path-concat.md
       */
      'n/no-path-concat': 'off',

      /**
       * https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unpublished-bin.md
       */
      'n/no-unpublished-bin': 'off',

      /**
       * https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-builtins.md
       */
      'n/no-unsupported-features/es-builtins': 'off',

      /**
       * https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md
       */
      'n/no-unsupported-features/es-syntax': 'off',

      /**
       * https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/node-builtins.md
       */
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
]);
