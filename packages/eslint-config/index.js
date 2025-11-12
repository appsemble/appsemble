import remcohaszing from '@remcohaszing/eslint';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
import formatjs from 'eslint-plugin-formatjs';
import appsemble from '@appsemble/eslint-plugin';
import { BasicAnnotationsReader } from 'ts-json-schema-generator';

import react from './configs/react.js';
import jsxA11y from './configs/jsx-a11y.js';
import preact from './configs/preact.js';

export default defineConfig([
  ...react,
  ...jsxA11y,
  ...preact,
  {
    extends: [remcohaszing],

    rules: {
      'unicorn/no-unnecessary-slice-end': 'off',
      'unicorn/prefer-global-this': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-jsx-props': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-union-types': 'off',
      'perfectionist/sort-exports': 'off',
      'import-x/consistent-type-specifier-style': 'off',
      'no-restricted-syntax': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      '@stylistic/max-len': 'off',
      '@stylistic/multiline-comment-style': 'off',
      '@stylistic/quotes': 'off',
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      'logical-assignment-operators': 'off',
      'n/exports-style': 'off',
      'no-empty-pattern': 'off',
      'no-unassigned-vars': 'off',
      'no-unused-expressions': 'off',
      'no-useless-assignment': 'off',
      'perfectionist/sort-array-includes': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-intersection-types': 'off',
      'perfectionist/sort-maps': 'off',
      'perfectionist/sort-named-exports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'unicorn/no-instanceof-builtins': 'off',
      'unicorn/no-useless-error-capture-stack-trace': 'off',
      'unicorn/prefer-import-meta-properties': 'off',
      'unicorn/prefer-math-min-max': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/require-module-specifiers': 'off',

      '@typescript-eslint/consistent-indexed-object-style': 'error',
      '@typescript-eslint/no-invalid-void-type': 'error',
    },
  },
  {
    plugins: {
      formatjs,
      vitest,
      appsemble,
    },

    settings: {
      node: {
        convertPath: {
          '**/*.ts': ['(.+)\\.ts$', '$1.js'],
        },
      },
    },

    rules: {
      'appsemble/enforce-index-decorator': 'error',
      'jsdoc/require-jsdoc': 'off',

      'jsdoc/check-tag-names': [
        'error',
        {
          definedTags: [...BasicAnnotationsReader.textTags, ...BasicAnnotationsReader.jsonTags],
        },
      ],

      'n/prefer-global/process': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/no-unsafe-regex': 'off',
      'unicorn/prefer-spread': 'off',

      'no-constant-condition': 'error',
    },
  },
  {
    files: ['packages/block-interaction-tests/vitest.setup.ts', 'blocks/list/vitest.setup.ts'],

    rules: {
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'class-methods-use-this': 'off',
    },
  },
  {
    files: ['packages/scripts/**'],

    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],

    rules: {
      'appsemble/enforce-index-decorator': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            'JSX.Element': 'Use ReactNode for React contexts and VNode for Preact contexts',

            ReactElement: {
              fixWith: 'ReactNode',
              message: 'Use ReactNode instead',
            },
          },
        },
      ],

      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-shadow': [
        'error',
        {
          hoist: 'functions',
        },
      ],

      'unicorn/prefer-array-flat': 'off',
    },
  },
  {
    files: ['packages/create-appsemble/templates/**'],

    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: ['**/__fixtures__/**'],

    rules: {
      'import/no-extraneous-dependencies': 'off',
      'n/no-extraneous-import': 'off',
    },
  },
  {
    files: ['packages/server/migrations/**/*'],

    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    files: ['**/*.md/*.js', '**/*.md/*.ts', '**/*.md/*.tsx'],

    rules: {
      'no-undef': 'off',
      'import/no-extraneous-dependencies': 'off',
      'n/no-extraneous-import': 'off',
    },
  },
  {
    files: ['**/*.test.*'],

    rules: {
      'vitest/consistent-test-it': [
        'error',
        {
          fn: 'it',
          withinDescribe: 'it',
        },
      ],

      'vitest/expect-expect': 'error',
      'vitest/no-alias-methods': 'error',
      'vitest/no-commented-out-tests': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-done-callback': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/no-interpolation-in-snapshots': 'error',
      'vitest/no-mocks-import': 'error',

      'vitest/no-restricted-matchers': [
        'error',
        {
          resolves: 'Use expect(await) instead',
          'not.toHaveBeenCalledWith': 'Use not.toHaveBeenCalled() instead',
          'toBeFalsy()': 'Use toBe(false) instead.',
          'toBeTruthy()': 'Use toBe(true) instead.',
        },
      ],

      'vitest/no-standalone-expect': 'error',
      'vitest/no-test-return-statement': 'error',
      'vitest/prefer-called-with': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-each': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-spy-on': 'error',
      'vitest/prefer-strict-equal': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-todo': 'error',
      'vitest/require-to-throw-message': 'error',
      'vitest/valid-describe-callback': 'error',
      'vitest/valid-expect': 'error',
      'vitest/valid-title': 'error',
      'jest-formatting/padding-around-after-all-blocks': 'error',
      'jest-formatting/padding-around-after-each-blocks': 'error',
      'jest-formatting/padding-around-before-all-blocks': 'error',
      'jest-formatting/padding-around-before-each-blocks': 'error',
      'jest-formatting/padding-around-describe-blocks': 'error',
      'jest-formatting/padding-around-test-blocks': 'error',
    },
  },
  {
    files: [
      'packages/server/utils/payments/stripe/**',
      'packages/utils/api/paths/payments/**',
      'packages/utils/api/paths/apps/appId/payments/**',
    ],

    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]);
