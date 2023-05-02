import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, parse } from 'node:path';

import { getWorkspaces, logger, opendirSafe, readData, writeData } from '@appsemble/node-utils';
import { type AppsembleMessages } from '@appsemble/types';
import { formatISO } from 'date-fns';
import fsExtra from 'fs-extra';
import { globby } from 'globby';
import { capitalize, mapValues } from 'lodash-es';
import { type BlockContent, type ListItem } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';
import semver from 'semver';
import { type PackageJson } from 'type-fest';
import { stringify } from 'yaml';
import { type Argv } from 'yargs';

import {
  createHeading,
  createLink,
  createList,
  createListItem,
  createRoot,
  dumpMarkdown,
} from '../lib/mdast.js';
import pkg from '../package.json' assert { type: 'json' };

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
 * @param dir The directory whose `package.json` to update.
 * @param version The new version to set.
 */
async function updatePkg(dir: string, version: string): Promise<void> {
  const filepath = join(dir, 'package.json');
  logger.info(`Updating ${filepath}`);
  const [pack] = await readData<PackageJson>(filepath);
  if (pack.name?.startsWith('@types/')) {
    return;
  }

  await writeData(
    filepath,
    mapValues(pack, (value, key) => {
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
    { sort: false },
  );
}

/**
 * Update `publiccode.yml`.
 *
 * @param version The software version to set
 */
async function updatePublicCodeYml(version: string): Promise<void> {
  const [publicCode] = await readData<any>('publiccode.yml');
  const i18nFiles = await readdir('i18n');
  const availableLanguages = i18nFiles.map((f) => parse(f).name).sort();
  await writeData(
    'publiccode.yml',
    mapValues(publicCode, (value, key) => {
      switch (key) {
        case 'softwareVersion':
          return version;
        case 'releaseDate':
          return formatISO(new Date(), { representation: 'date' });
        case 'localisation':
          return {
            ...value,
            availableLanguages,
          };
        default:
          return value;
      }
    }),
    { sort: false },
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
  const content = await readFile(filename, 'utf8');
  const updated = content.split(oldVersion).join(newVersion);
  await writeFile(filename, updated);
}

async function processChangesDir(dir: string, prefix: string): Promise<ListItem[]> {
  await fsExtra.ensureFile(join(dir, '.gitkeep'));

  const filenames = await readdir(dir);
  const absoluteFiles = filenames.filter((f) => f !== '.gitkeep').map((f) => join(dir, f));
  const lines = await Promise.all(absoluteFiles.map((f) => readFile(f, 'utf8')));
  await Promise.all(absoluteFiles.map((f) => rm(f, { force: true, recursive: true })));
  return lines
    .filter(Boolean)
    .sort()
    .map((line) => `${prefix}: ${line}`)
    .map((line) => line.trim())
    .map((line) => (line.endsWith('.') ? line : `${line}.`))
    .map((line) => createListItem(fromMarkdown(line).children as BlockContent[]));
}

async function processDirectoryChanges(dir: string): Promise<Changes> {
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

async function getAllChanges(directories: string[]): Promise<Changes> {
  const changesByPackage = await Promise.all(directories.map(processDirectoryChanges));
  const result: Changes = {
    added: [],
    changed: [],
    deprecated: [],
    removed: [],
    fixed: [],
    security: [],
  };
  for (const change of changesByPackage) {
    result.added.push(...change.added);
    result.changed.push(...change.changed);
    result.removed.push(...change.removed);
    result.fixed.push(...change.fixed);
    result.security.push(...change.security);
  }

  return result;
}

async function updateChangelog(changesByCategory: Changes, version: string): Promise<void> {
  const changelog = fromMarkdown(await readFile('CHANGELOG.md', 'utf8'));
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
  await writeFile('CHANGELOG.md', await dumpMarkdown(changelog, 'CHANGELOG.md'));
}

async function updateHelmChart(changes: Changes, version: string): Promise<void> {
  const [chart] = await readData<any>('config/charts/appsemble/Chart.yaml');
  const changelog = stringify(
    Object.entries(changes).flatMap(([kind, entries]) =>
      entries.map((entry: ListItem) => ({
        kind,
        description: toString(entry).replace(/\s+/g, ' '),
      })),
    ),
  );
  await writeData(
    'config/charts/appsemble/Chart.yaml',
    mapValues(chart, (value, key) => {
      switch (key) {
        case 'appVersion':
        case 'version':
          return version;
        case 'annotations':
          return mapValues(value, (val, k) => (k === 'artifacthub.io/changes' ? changelog : val));
        default:
          return value;
      }
    }),
    { sort: false },
  );
}

async function updateAppTranslations(version: string): Promise<void> {
  await opendirSafe('apps', (appDir) =>
    opendirSafe(join(appDir, 'i18n'), async (i18nFile) => {
      const [content] = await readData<AppsembleMessages>(i18nFile);
      if (!content.blocks) {
        return;
      }
      for (const [blockId, versions] of Object.entries(content.blocks)) {
        if (!blockId.startsWith('@appsemble')) {
          continue;
        }
        const [[oldVersion, messages]] = Object.entries(versions);
        delete versions[oldVersion];
        versions[version] = messages;
      }
      await writeData(i18nFile, content);
    }),
  );
}

export function builder(yargs: Argv): Argv<any> {
  return yargs.positional('increment', {
    description: 'Whether to increment the minor or patch version',
    choices: ['minor', 'patch'],
  });
}

export async function handler({ increment }: Args): Promise<void> {
  const workspaces = await getWorkspaces(process.cwd());
  logger.info(`Old version: ${pkg.version}`);
  const version = semver.inc(pkg.version, increment);
  logger.info(`New version: ${version}`);
  const paths = await globby(
    [
      'apps/*/index.html',
      'apps/*/app-definition.yaml',
      'docs/*.md',
      'docs/**/*.md',
      'docs/*.mdx',
      'docs/**/*.mdx',
      'blocks/**/*.md',
      'packages/**/*.md',
      'Dockerfile',
    ],
    { absolute: true, gitignore: true },
  );
  const templateDir = 'packages/create-appsemble/templates';
  const templates = await readdir(templateDir);
  await Promise.all(templates.map((t) => updatePkg(join(process.cwd(), templateDir, t), version)));
  await Promise.all(paths.map((filepath) => replaceFile(filepath, pkg.version, version)));
  await Promise.all(workspaces.map((workspace) => updatePkg(workspace, version)));
  await updatePkg(process.cwd(), version);
  await updatePublicCodeYml(version);
  const changes = await getAllChanges(workspaces);
  await updateChangelog(changes, version);
  await updateHelmChart(changes, version);
  await updateAppTranslations(version);
}
