// https://github.com/vitest-dev/vitest/issues/740#issuecomment-1254766751
import 'sharp';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const isGitLabCi = process.env.GITLAB_CI === 'true';
const maxWorkers = process.env.VITEST_MAX_WORKERS ?? (isGitLabCi ? '90%' : '50%');

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    maxWorkers,
    reporters: ['junit', 'default'],
    outputFile: {
      junit: 'junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['cobertura', 'html', 'text'],
    },
  },
});
