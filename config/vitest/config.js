import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Generate a proper Vitest configuration based on a project context.
 *
 * @param {ImportMeta} meta The import module meta object.
 * @returns {import('vitest/config').UserProjectConfigExport} A vitest configuration for the project.
 */
export function createVitestConfig({ url }) {
  const { compilerOptions: { lib = [] } = {} } = JSON.parse(
    readFileSync(new URL('tsconfig.json', url)),
  );

  const setupFilesAfterEnv = [];

  // Load vitest.setup.ts if it exists, otherwise skip it.
  const setup = new URL('vitest.setup.ts', url);
  if (existsSync(setup)) {
    setupFilesAfterEnv.push(fileURLToPath(setup));
  }

  return {
    test: {
      globals: true,
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
      hookTimeout: 60_000,
      testTimeout: 60_000,
      environment: lib.includes('dom') || lib.includes('webworker') ? 'jsdom' : 'node',
      setupFiles: setupFilesAfterEnv,
      environmentOptions: {
        jsdom: {
          url: 'http://localhost:80',
        },
      },
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
    },
  };
}
