import { promises as fs } from 'fs';
import { basename, dirname, join } from 'path';

import { getWorkspaces, logger } from '@appsemble/node-utils';
import { formatISO } from 'date-fns';
import { ensureFile, readJson, remove, writeJson } from 'fs-extra';
import globby from 'globby';
import { capitalize, mapValues } from 'lodash';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BlockContent, ListItem, Root } from 'mdast';
import remark from 'remark';
import * as semver from 'semver';
import { PackageJson } from 'type-fest';
import { Argv } from 'yargs';

import {
  createHeading,
  createLink,
  createList,
  createListItem,
  createRoot,
  dumpMarkdown,
} from '../lib/mdast';
import { readPackageJson } from '../lib/readPackageJson';

export const command = 'release <increment>';
export const description = 'Prepare files for a new release.';

interface Args {
  increment: 'minor' | 'patch';
}

interface Changes {
  added: ListItem[];
  changed: ListItem[];
  deprecated: ListItem[];
  removed: ListItem[];
  fixed: ListItem[];
  security: ListItem[];
}

/**
 * Update `package.json` in a directory.
 *
 * @param dir - The directory whose `package.json` to update.
 * @param version - The new version to set.
 */
async function updatePkg(dir: string, version: string): Promise<void> {
  const filepath = join(dir, 'package.json');
  logger.info(`Updating ${filepath}`);
  const pkg: PackageJson = await readJson(filepath);
  if (pkg.name?.startsWith('@types/')) {
    return;
  }

  await writeJson(
    filepath,
    mapValues(pkg, (value, key) => {
      switch (key) {
        case 'version':
          return version;
        case 'dependencies':
        case 'devDependencies':
        case 'optionalDependencies':
        case 'peerDependencies':
          return mapValues(value as PackageJson.Dependency, (v, dep) =>
            dep.startsWith('@appsemble/') ? version : v,
          );
        default:
          return value;
      }
    }),
    { spaces: 2 },
  );
}

/**
 * Replace content of a file.
 *
 * @param filename - The filename of the file to replace.
 * @param oldVersion - The content to replace.
 * @param newVersion - The content to replace the old content with.
 */
async function replaceFile(
  filename: string,
  oldVersion: string,
  newVersion: string,
): Promise<void> {
  logger.info(`Updating ${filename}`);
  const content = await fs.readFile(filename, 'utf-8');
  const updated = content.split(oldVersion).join(newVersion);
  await fs.writeFile(filename, updated);
}

async function processChangesDir(dir: string, prefix: string): Promise<ListItem[]> {
  await ensureFile(join(dir, '.gitkeep'));

  const filenames = await fs.readdir(dir);
  const absoluteFiles = filenames.filter((f) => f !== '.gitkeep').map((f) => join(dir, f));
  const lines = await Promise.all(absoluteFiles.map((f) => fs.readFile(f, 'utf-8')));
  await Promise.all(absoluteFiles.map((f) => remove(f)));
  return lines
    .filter(Boolean)
    .sort()
    .map((line) => `${prefix}: ${line}`)
    .map((line) => line.trim())
    .map((line) => (line.endsWith('.') ? line : `${line}.`))
    .map((line) => createListItem(remark.parse(line).children as BlockContent[]));
}

async function processChanges(dir: string): Promise<Changes> {
  const changesDir = join(dir, 'changed');
  const base = basename(dir);
  const parent = basename(dirname(dir));
  const prefix = parent === 'blocks' ? `Block(\`${base}\`)` : capitalize(base);
  const result = {
    added: await processChangesDir(join(changesDir, 'added'), prefix),
    changed: await processChangesDir(join(changesDir, 'changed'), prefix),
    deprecated: await processChangesDir(join(changesDir, 'deprecated'), prefix),
    removed: await processChangesDir(join(changesDir, 'removed'), prefix),
    fixed: await processChangesDir(join(changesDir, 'fixed'), prefix),
    security: await processChangesDir(join(changesDir, 'security'), prefix),
  };
  return result;
}

async function updateChangelog(workspaces: string[], version: string): Promise<void> {
  const changesByPackage = await Promise.all(
    workspaces.map((workspace) => processChanges(workspace)),
  );
  const changelog = remark.parse(await fs.readFile('CHANGELOG.md', 'utf-8')) as Root;
  const changesByCategory = changesByPackage.reduce<Changes>(
    (acc, change) => {
      acc.added.push(...change.added);
      acc.changed.push(...change.changed);
      acc.deprecated.push(...change.deprecated);
      acc.removed.push(...change.removed);
      acc.fixed.push(...change.fixed);
      acc.security.push(...change.security);
      return acc;
    },
    { added: [], changed: [], deprecated: [], removed: [], fixed: [], security: [] },
  );
  const changesSection = [
    createHeading(2, [
      '[',
      createLink(`https://gitlab.com/appsemble/appsemble/-/releases/${version}`, [version]),
      '] - ',
      formatISO(new Date(), { representation: 'date' }),
    ]),
    ...Object.entries(changesByCategory)
      .filter(([, changes]) => changes.length)
      .flatMap(([category, listItems]: [string, ListItem[]]) => [
        createHeading(3, [capitalize(category)]),
        createList(listItems),
      ]),
  ];
  changelog.children.find((child, index) => {
    if (child.type === 'heading' && child.depth === 2) {
      changelog.children.splice(index, 0, ...changesSection);
      return true;
    }
  });
  logger.info(await dumpMarkdown(createRoot(changesSection), 'CHANGELOG.md'));
  await fs.writeFile('CHANGELOG.md', await dumpMarkdown(changelog, 'CHANGELOG.md'));
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
  const templates = await fs.readdir(templateDir);
  await Promise.all(templates.map((t) => updatePkg(join(process.cwd(), templateDir, t), version)));
  await Promise.all(paths.map((filepath) => replaceFile(filepath, pkg.version, version)));
  await Promise.all(workspaces.map((workspace) => updatePkg(workspace, version)));
  await updatePkg(process.cwd(), version);
  await updateChangelog(workspaces, version);
}
