import { readData } from '@appsemble/node-utils';
import { PackageJson } from 'type-fest';

/**
 * Read package.json
 *
 * TypeScript doesn’t allow importing files from outside of rootDir.
 *
 * @returns The contents of package.json
 */
export async function readPackageJson(): Promise<PackageJson> {
  const [pkg] = await readData<PackageJson>(require.resolve('../package.json'));
  return pkg;
}
