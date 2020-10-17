import { promises as fs } from 'fs';
import { URL } from 'url';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import type { Argv } from 'yargs';

interface Args {
  dockerHubUsername: string;
  dockerHubPassword: string;
}

export const command = 'post-release';
export const description = 'Perform various post release actions.';

const DOCKER_HUB_URL = 'https://hub.docker.com';

export function builder(yargs: Argv): Argv {
  return yargs
    .option('docker-hub-username', {
      group: 'docker-hub',
      describe: `The username to login to ${DOCKER_HUB_URL}`,
      demandOption: true,
    })
    .option('docker-hub-password', {
      group: 'docker-hub',
      describe: `The password or token to login to ${DOCKER_HUB_URL}`,
      demandOption: true,
    });
}

/**
 * Update the release on Docker Hub.
 *
 * @param args - The command line arguments.
 */
async function updateDockerHub({ dockerHubPassword, dockerHubUsername }: Args): Promise<void> {
  const readme = await fs.readFile(require.resolve('@appsemble/server/README.md'), 'utf-8');
  const docker = axios.create({ baseURL: String(new URL('/v2', DOCKER_HUB_URL)) });

  logger.info(`Logging in to ${DOCKER_HUB_URL}`);
  const {
    data: { token },
  } = await docker.post('users/login', {
    username: dockerHubUsername,
    password: dockerHubPassword,
  });
  docker.defaults.headers.authorization = `JWT ${token}`;
  logger.info(`Successfully logged in to ${DOCKER_HUB_URL}`);

  logger.info(`Updating full description on ${DOCKER_HUB_URL}`);
  await docker.patch('repositories/appsemble/appsemble', { full_description: readme });
  logger.info(`Successfully updated full description on ${DOCKER_HUB_URL}`);
}

export async function handler(args: Args): Promise<void> {
  await updateDockerHub(args);
}
