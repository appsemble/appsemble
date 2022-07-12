import { readdir } from 'fs/promises';
import { join } from 'path';

import { logger, readData } from '@appsemble/node-utils';
import { PackageJson } from 'type-fest';

import { getReleaseNotes } from '../lib/changelog';
import { AssetLink, gitlab, Release } from '../lib/gitlab';

export const command = 'gitlab-release';
export const description = 'Create a GitLab release.';

const { CI_COMMIT_TAG } = process.env;

/**
 * Read `package.json` for all packages in the given directory.
 *
 * @param dirname The directory to read package names from.
 * @returns A list of package.json file contents.
 */
async function readPackages(dirname: string): Promise<PackageJson[]> {
  const packageDirs = await readdir(dirname);
  return Promise.all(
    packageDirs.map(async (name) => {
      const [pkg] = await readData<PackageJson>(join(dirname, name, 'package.json'));
      return pkg;
    }),
  );
}

/**
 * Create a GitLab release.
 */
export async function handler(): Promise<void> {
  const releaseNotes = await getReleaseNotes();
  logger.info('## Release notes');
  logger.info('');
  logger.info(releaseNotes);
  const packages = (await readPackages('packages'))
    .filter((pkg) => !pkg.private)
    .map<AssetLink>(({ name, version }) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      link_type: 'package',
      name: `${name}@${version}`,
      url: `https://www.npmjs.com/package/${name}/v/${version}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const blocks = (await readPackages('blocks'))
    .map<AssetLink>(({ name, version }) => ({
      name: `${name}@${version}`,
      url: `https://appsemble.app/en/blocks/${name}/${version}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  logger.info('Creating GitLab release');
  await gitlab.post('releases', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tag_name: CI_COMMIT_TAG,
    description: releaseNotes,
    assets: {
      links: [
        ...packages,
        ...blocks,
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          link_type: 'image',
          name: `appsemble/appsemble#${CI_COMMIT_TAG}`,
          url: 'https://hub.docker.com/r/appsemble/appsemble',
        },
      ],
    },
  } as Release);
  logger.info('Successfully created GitLab release');
}
