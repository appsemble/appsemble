import { promises as fs } from 'fs';
import { join } from 'path';
import { URL } from 'url';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import { readJson } from 'fs-extra';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Text } from 'mdast';
import fromMarkdown from 'mdast-util-from-markdown';
import toMarkdown from 'mdast-util-to-markdown';
import { PackageJson } from 'type-fest';
import visit from 'unist-util-visit';

export const command = 'post-release';
export const description = 'Perform various post release actions.';

const DOCKER_HUB_URL = 'https://hub.docker.com';

const { DOCKER_HUB_PASSWORD, DOCKER_HUB_USERNAME } = process.env;
const { CI_API_V4_URL, CI_COMMIT_TAG, CI_JOB_TOKEN, CI_PROJECT_ID } = process.env;

/**
 * Read `package.json` for all packages in the given directory.
 *
 * @param dirname - The directory to read package names from.
 * @returns A list of package.json file contents.
 */
async function readPackages(dirname: string): Promise<PackageJson[]> {
  const packageDirs = await fs.readdir(dirname);
  return Promise.all(packageDirs.map((name) => readJson(join(dirname, name, 'package.json'))));
}

/**
 * Create a GitLab release.
 *
 * @param releaseNotes - The release notes to include
 */
async function createGitlabRelease(releaseNotes: string): Promise<void> {
  const packages = (await readPackages('packages'))
    .filter((pkg) => !pkg.private)
    .map(({ name, version }) => ({
      link_type: 'package',
      name: `${name}@${version}`,
      url: `https://www.npmjs.com/package/${name}/v/${version}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const blocks = (await readPackages('blocks'))
    .map(({ name, version }) => ({
      name: `${name}@${version}`,
      url: `https://appsemble.app/en/blocks/${name}/${version}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  logger.info('Creating GitLab release');
  await axios.post(
    `${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/releases`,
    {
      tag_name: CI_COMMIT_TAG,
      description: releaseNotes,
      assets: {
        links: [
          ...packages,
          ...blocks,
          {
            link_type: 'image',
            name: `appsemble/appsemble#${CI_COMMIT_TAG}`,
            url: 'https://hub.docker.com/r/appsemble/appsemble',
          },
        ],
      },
    },
    { headers: { Authorization: `Bearer ${CI_JOB_TOKEN}` } },
  );
  logger.info('Successfully created GitLab release');
}

/**
 * Get the release notes for the latest release.
 *
 * @returns The release notes for the last version
 */
async function getReleaseNotes(): Promise<string> {
  const changelog = await fs.readFile('CHANGELOG.md', 'utf-8');
  const ast = fromMarkdown(changelog);
  let sectionStart: number;
  let sectionEnd: number;
  for (const [index, child] of ast.children.entries()) {
    if (child.type !== 'heading' || child.depth !== 2) {
      continue;
    }
    if (sectionStart) {
      sectionEnd = index;
      break;
    } else {
      sectionStart = index;
    }
  }
  ast.children.splice(sectionEnd);
  ast.children.splice(0, sectionStart + 1);
  visit<Text>(ast, 'text', (node) => {
    // eslint-disable-next-line no-param-reassign
    node.value = node.value.replace(/\n+/g, (match) => (match.length === 1 ? ' ' : '\n\n'));
  });
  const releaseNotes = toMarkdown(ast, { bullet: '-', listItemIndent: 'one', strong: '_' });
  logger.info('## Release notes');
  logger.info('');
  logger.info(releaseNotes);
  return releaseNotes;
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
  await docker.patch('repositories/appsemble/appsemble', { full_description: readme });
  logger.info(`Successfully updated full description on ${DOCKER_HUB_URL}`);
}

export async function handler(): Promise<void> {
  const releaseNotes = await getReleaseNotes();
  await updateDockerHub();
  await createGitlabRelease(releaseNotes);
}
