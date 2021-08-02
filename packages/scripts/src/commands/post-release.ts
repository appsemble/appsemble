import { promises as fs } from 'fs';
import { join } from 'path';
import { URL } from 'url';

import { logger, readData } from '@appsemble/node-utils';
import axios from 'axios';
import { PackageJson } from 'type-fest';

import { getReleaseNotes } from '../lib/changelog';
import { AssetLink, gitlab, Release } from '../lib/gitlab';

export const command = 'post-release';
export const description = 'Perform various post release actions.';

const DOCKER_HUB_URL = 'https://hub.docker.com';

const { DOCKER_HUB_PASSWORD, DOCKER_HUB_USERNAME } = process.env;
const { CI_COMMIT_TAG } = process.env;

/**
 * Read `package.json` for all packages in the given directory.
 *
 * @param dirname - The directory to read package names from.
 * @returns A list of package.json file contents.
 */
async function readPackages(dirname: string): Promise<PackageJson[]> {
  const packageDirs = await fs.readdir(dirname);
  return Promise.all(
    packageDirs.map(async (name) => {
      const [pkg] = await readData<PackageJson>(join(dirname, name, 'package.json'));
      return pkg;
    }),
  );
}

/**
 * Create a GitLab release.
 *
 * @param releaseNotes - The release notes to include
 */
async function createGitlabRelease(releaseNotes: string): Promise<void> {
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

/**
 * Update the release on Docker Hub.
 */
async function updateDockerHub(): Promise<void> {
  const readme = await fs.readFile(require.resolve('@appsemble/server/README.md'), 'utf-8');
  const docker = axios.create({ baseURL: String(new URL('/v2', DOCKER_HUB_URL)) });

  logger.info(`Logging in to ${DOCKER_HUB_URL}`);
  const {
    data: { token },
  } = await docker.post('users/login', {
    username: DOCKER_HUB_USERNAME,
    password: DOCKER_HUB_PASSWORD,
  });
  docker.defaults.headers.authorization = `JWT ${token}`;
  logger.info(`Successfully logged in to ${DOCKER_HUB_URL}`);

  logger.info(`Updating full description on ${DOCKER_HUB_URL}`);
  // eslint-disable-next-line @typescript-eslint/naming-convention
  await docker.patch('repositories/appsemble/appsemble', { full_description: readme });
  logger.info(`Successfully updated full description on ${DOCKER_HUB_URL}`);
}

export async function handler(): Promise<void> {
  const releaseNotes = await getReleaseNotes();
  logger.info('## Release notes');
  logger.info('');
  logger.info(releaseNotes);
  await updateDockerHub();
  await createGitlabRelease(releaseNotes);
}
