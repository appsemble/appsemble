import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineProject, type UserProjectConfigExport } from 'vitest/config';

/**
 * Generate a proper Vitest configuration based on a project context.
 *
 * @param meta The import module meta object.
 * @returns A vitest configuration for the project.
 */
export function createVitestConfig({ url }: ImportMeta): UserProjectConfigExport {
  const readJSON = (path: string): Record<string, any> =>
    JSON.parse(readFileSync(new URL(path, url)) as unknown as string);

  const { compilerOptions: { lib = [] } = {} } = readJSON('tsconfig.json');

  const setupFilesAfterEnv = [];

  // Load vitest.setup.ts if it exists, otherwise skip it.
  const setup = new URL('vitest.setup.ts', url);
  if (existsSync(setup)) {
    setupFilesAfterEnv.push(fileURLToPath(setup));
  }

  return defineProject({
    test: {
      globals: true,
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
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
  });
}
