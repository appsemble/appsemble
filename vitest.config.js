// https://github.com/vitest-dev/vitest/issues/740#issuecomment-1254766751
import 'sharp';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
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
