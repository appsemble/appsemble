// https://github.com/lint-staged/lint-staged/issues/825#issuecomment-620018284
export default {
  '*.css': ['stylelint --report-needless-disables'],
  '*.md': ['remark --frail --no-stdout'],
  '*.{html,json,md,scss,yaml,yml}': ['prettier --check'],
  '*.{js,md,ts,tsx}': ['eslint'],
  '**/*.ts?(x)': [() => 'npx --workspaces tsc --incremental --noEmit'],
  '**/{messages.ts,package.json,tsconfig.json,vitest.config.js,LICENSE.md,packages/{cli/assets/appsemblerc.schema.json,types/cli.ts}}':
    ["sh -c 'tsx packages/scripts/index.ts validate'"],
};
