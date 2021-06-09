import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import { getReleaseNotes } from '../lib/changelog';

export const command = 'github-release';
export const description = 'Create a release on GitHub.';

const { CI_COMMIT_TAG, GITHUB_TOKEN } = process.env;

export async function handler(): Promise<void> {
  const body = await getReleaseNotes();
  logger.info(CI_COMMIT_TAG);
  logger.info('');
  logger.info(body);
  await axios.post(
    'https://api.github.com/repos/appsemble/appsemble/releases',
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tag_name: CI_COMMIT_TAG,
      name: CI_COMMIT_TAG,
      body,
    },
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    },
  );
}
