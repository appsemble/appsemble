import { getWorkspaces, logger } from '@appsemble/node-utils';
import { readJson, writeJson } from 'fs-extra';
import * as path from 'path';
import * as semver from 'semver';
import type { PackageJson } from 'type-fest';
import type { Argv } from 'yargs';

import readPackageJson from '../lib/readPackageJson';

export const command = 'release <increment>';
export const description = 'Prepare files for a new release.';

interface Args {
  increment: 'minor' | 'patch';
}

async function updatePkg(dirname: string, version: string): Promise<void> {
  const filepath = path.join(dirname, 'package.json');
  const pkg: PackageJson = await readJson(filepath);
  if (pkg.name?.startsWith('@types/')) {
    return;
  }

  await writeJson(
    filepath,
    Object.fromEntries(
      Object.entries(pkg).map(([key, value]) => {
        if (key === 'version') {
          return [key, version];
        }
        if (
          key === 'dependencies' ||
          key === 'devDependencies' ||
          key === 'optionalDependencies' ||
          key === 'peerDependencies'
        ) {
          return [
            key,
            Object.fromEntries(
              Object.entries(value).map(([dep, v]) => {
                if (dep.startsWith('@appsemble/')) {
                  return [dep, version];
                }
                return [dep, v];
              }),
            ),
          ];
        }
        return [key, value];
      }),
    ),
    { spaces: 2 },
  );
}

export function builder(yargs: Argv): Argv {
  return yargs.positional('increment', {
    description: 'Wether to increment the minor or patch version',
    choices: ['minor', 'patch'],
  });
}

export async function handler({ increment }: Args): Promise<void> {
  const workspaces = await getWorkspaces(process.cwd());
  const pkg = readPackageJson();
  logger.info(`Old version: ${pkg.version}`);
  const version = semver.inc(pkg.version, increment);
  logger.info(`New version: ${version}`);
  await Promise.all(workspaces.map((workspace) => updatePkg(workspace, version)));
  await updatePkg(process.cwd(), version);
}
