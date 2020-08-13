import { readFileSync } from 'fs';

import type { PackageJson } from 'type-fest';

/**
 * Read package.json
 *
 * TypeScript doesn’t allow importing files from outside of rootDir.
 *
 * @returns The contents of package.json
 */
export function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(require.resolve('../../package.json'), 'utf-8'));
}
