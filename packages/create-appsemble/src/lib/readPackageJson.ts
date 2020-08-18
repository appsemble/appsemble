import { readJson } from 'fs-extra';
import type { PackageJson } from 'type-fest';

/**
 * Read package.json
 *
 * TypeScript doesn’t allow importing files from outside of rootDir.
 *
 * @returns The contents of package.json
 */
export function readPackageJson(): Promise<PackageJson> {
  return readJson(require.resolve('../../package.json'));
}
