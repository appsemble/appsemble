import { getWorkspaces, logger } from '@appsemble/node-utils';
import { readdir, readFile, readJson, writeFile, writeJson } from 'fs-extra';
import globby from 'globby';
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

/**
 * Update `package.json` in a directory.
 *
 * @param dirname The directory whose `package.json` to update.
 * @param version The new version to set.
 */
async function updatePkg(dirname: string, version: string): Promise<void> {
  const filepath = path.join(dirname, 'package.json');
  logger.info(`Updating ${filepath}`);
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

/**
 * Replace content of a file.
 *
 * @param filename The filename of the file to replace.
 * @param oldVersion The content to replace.
 * @param newVersion The content to replace the old content with.
 */
async function replaceFile(
  filename: string,
  oldVersion: string,
  newVersion: string,
): Promise<void> {
  logger.info(`Updating ${filename}`);
  const content = await readFile(filename, 'utf-8');
  const updated = content.split(oldVersion).join(newVersion);
  await writeFile(filename, updated);
}

export function builder(yargs: Argv): Argv {
  return yargs.positional('increment', {
    description: 'Whether to increment the minor or patch version',
    choices: ['minor', 'patch'],
  });
}

export async function handler({ increment }: Args): Promise<void> {
  const workspaces = await getWorkspaces(process.cwd());
  const pkg = readPackageJson();
  logger.info(`Old version: ${pkg.version}`);
  const version = semver.inc(pkg.version, increment);
  logger.info(`New version: ${version}`);
  const paths = await globby(
    [
      'apps/*/app.yaml',
      'config/charts/*/Chart.yaml',
      'docs/*.md',
      'docs/**/*.md',
      'docs/*.mdx',
      'docs/**/*.mdx',
      'blocks/**/*.md',
    ],
    { absolute: true, gitignore: true },
  );
  const templateDir = 'packages/create-appsemble/templates';
  const templates = await readdir(templateDir);
  await Promise.all(
    templates.map((t) => updatePkg(path.join(process.cwd(), templateDir, t), version)),
  );
  await Promise.all(paths.map((filepath) => replaceFile(filepath, pkg.version, version)));
  await Promise.all(workspaces.map((workspace) => updatePkg(workspace, version)));
  await updatePkg(process.cwd(), version);
}
