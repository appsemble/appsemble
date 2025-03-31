import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, parse } from 'node:path';

import {
  getWorkspaces,
  logger,
  opendirSafe,
  readData,
  version,
  writeData,
} from '@appsemble/node-utils';
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

export const command = 'release <increment>';
export const description = 'Prepare files for a new release.';

interface Args {
  increment: 'minor' | 'patch' | 'prerelease';
  identifier: 'test';
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
 * @param newVersion The new version to set.
 */
async function updatePkg(dir: string, newVersion: string): Promise<void> {
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
          return newVersion;
        case 'dependencies':
        case 'devDependencies':
        case 'optionalDependencies':
        case 'peerDependencies':
          return mapValues(value as PackageJson.Dependency, (v, dep) =>
            dep.startsWith('@appsemble/') ? newVersion : v,
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
 * @param newVersion The software version to set
 */
async function updatePublicCodeYml(newVersion: string): Promise<void> {
  const [publicCode] = await readData<any>('publiccode.yml');
  const i18nFiles = await readdir('i18n');
  const availableLanguages = i18nFiles.map((f) => parse(f).name).sort();
  await writeData(
    'publiccode.yml',
    mapValues(publicCode, (value, key) => {
      switch (key) {
        case 'softwareVersion':
          return newVersion;
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

async function updateChangelog(changesByCategory: Changes, newVersion: string): Promise<void> {
  const changelog = fromMarkdown(await readFile('CHANGELOG.md', 'utf8'));
  const changesSection = [
    createHeading(2, [
      '[',
      createLink(`https://gitlab.com/appsemble/appsemble/-/releases/${newVersion}`, [newVersion]),
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

async function updateHelmChart(changes: Changes, newVersion: string): Promise<void> {
  const [chart] = await readData<any>('config/charts/appsemble/Chart.yaml');
  const changelog = stringify(
    Object.entries(changes).flatMap(([kind, entries]) =>
      entries.map((entry: ListItem) => ({
        kind,
        description: toString(entry).replaceAll(/\s+/g, ' '),
      })),
    ),
  );
  await writeData(
    'config/charts/appsemble/Chart.yaml',
    mapValues(chart, (value, key) => {
      switch (key) {
        case 'appVersion':
        case 'version':
          return newVersion;
        case 'annotations':
          return mapValues(value, (val, k) => (k === 'artifacthub.io/changes' ? changelog : val));
        default:
          return value;
      }
    }),
    { sort: false },
  );
}

async function updateAppTranslations(newVersion: string): Promise<void> {
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
        versions[newVersion] = messages;
      }
      await writeData(i18nFile, content);
    }),
  );
}

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('increment', {
      description: 'Whether to increment the minor, patch or pre-release version',
      choices: ['minor', 'patch', 'prerelease'],
    })
    .option('identifier', {
      description: `The identifier to use for the pre-release version:
        - test: Internal testing or testing with clients (e.g., test.3).`,
      choices: ['test'],
      default: undefined,
    })
    .check((argv) => {
      if (argv.increment === 'prerelease' && !argv.identifier) {
        throw new Error(
          'The "identifier" must be specified when incrementing the pre-release version.',
        );
      }
      if (argv.increment !== 'prerelease' && argv.identifier) {
        throw new Error(
          'The "identifier" option can only be used with the "prerelease" increment.',
        );
      }
      return true;
    })
    .epilogue(
      'Examples:\n' +
        '  Increment to the next test version:\n' +
        '    npm run scripts -- release prerelease --identifier test\n' +
        '  Increment the minor version:\n' +
        '    npm run scripts -- release minor\n' +
        '  Increment the patch version:\n' +
        '    npm run scripts -- release patch',
    );
}

export async function handler({ identifier, increment }: Args): Promise<void> {
  const workspaces = await getWorkspaces(process.cwd());
  logger.info(`Old version: ${version}`);
  const newVersion = semver.inc(version, increment, identifier);
  if (newVersion == null) {
    throw new Error(`Invalid version increment: ${increment}, semver.inc returned ${newVersion}`);
  }
  logger.info(`New version: ${newVersion}`);
  const paths = await globby(
    [
      'apps/*/index.html',
      'apps/*/app-definition.yaml',
      'packages/studio/pages/docs/**/*.md',
      'packages/studio/pages/docs/**/*.mdx',
      'blocks/**/*.md',
      'packages/**/*.md',
      '!packages/**/changed/**/*.md',
      '!packages/studio/pages/docs/docs/guides/config.md',
      'Dockerfile',
    ],
    { absolute: true, gitignore: true },
  );
  const blockTemplateDir = 'packages/cli/templates/blocks';
  const blocksTemplates = await readdir(blockTemplateDir);
  await Promise.all(
    blocksTemplates.map((t) => updatePkg(join(process.cwd(), blockTemplateDir, t), newVersion)),
  );

  const appsTemplateDir = 'packages/cli/templates/apps';
  const appsTemplates = await globby([`${appsTemplateDir}/*/app-definition.yaml`]);
  await Promise.all(appsTemplates.map((t) => replaceFile(t, version, newVersion)));

  const projectTemplatesDir = 'packages/create-appsemble/templates';
  const projectTemplates = await readdir(projectTemplatesDir);
  await Promise.all(
    projectTemplates.map((t) => updatePkg(join(process.cwd(), projectTemplatesDir, t), newVersion)),
  );

  await Promise.all(paths.map((filepath) => replaceFile(filepath, version, newVersion)));

  await Promise.all(workspaces.map((workspace) => updatePkg(workspace, newVersion)));
  await updatePkg(process.cwd(), newVersion);
  await updatePublicCodeYml(newVersion);
  const changes = await getAllChanges(workspaces);
  await updateChangelog(changes, newVersion);
  await updateHelmChart(changes, newVersion);
  await updateAppTranslations(newVersion);
}
