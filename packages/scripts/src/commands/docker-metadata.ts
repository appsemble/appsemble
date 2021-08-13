import { promises as fs } from 'fs';
import { URL } from 'url';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';

export const command = 'docker-metadata';
export const description = 'Update metadata on Docker Hub.';

const DOCKER_HUB_URL = 'https://hub.docker.com';

const { DOCKER_HUB_PASSWORD, DOCKER_HUB_USERNAME } = process.env;

/**
 * Update the release on Docker Hub.
 */
export async function handler(): Promise<void> {
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
