import { readFile } from 'node:fs/promises';

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
  const readme = await readFile(new URL('../../server/README.md', import.meta.url), 'utf8');
  const docker = axios.create({ baseURL: String(new URL('/v2', DOCKER_HUB_URL)) });

  logger.info(`Logging in to ${DOCKER_HUB_URL}`);
  const {
    data: { token },
  } = await docker.post<{ token: string }>('users/login', {
    username: DOCKER_HUB_USERNAME,
    password: DOCKER_HUB_PASSWORD,
  });
  logger.info(`Successfully logged in to ${DOCKER_HUB_URL}`);

  logger.info(`Updating full description on ${DOCKER_HUB_URL}`);
  await docker.patch(
    'repositories/appsemble/appsemble',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { full_description: readme },
    { headers: { authorization: `JWT ${token}` } },
  );
  logger.info(`Successfully updated full description on ${DOCKER_HUB_URL}`);
}
