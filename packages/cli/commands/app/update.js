import { logger } from '@appsemble/node-utils';

import { getToken } from '../../lib/config';
import updateApp from '../../lib/updateApp';

export const command = 'update <path>';
export const description = 'Updated a new App based on a specified YAML file or directory.';

export function builder(yargs) {
  return yargs
    .positional('path', {
      describe: 'The path to the app to register',
      normalize: true,
    })
    .option('appId', {
      describe: 'The ID of the app to update.',
      demand: true,
    })
    .option('private', {
      describe: 'Whether the app should be marked as private.',
      default: true,
      type: 'boolean',
    })
    .option('template', {
      describe: 'Whether the app should be marked as a template.',
      default: false,
      type: 'boolean',
    });
}

export async function handler({ appId, path, private: isPrivate, remote, template }) {
  await getToken(remote);
  logger.info(`Updating App ${appId}`);
  await updateApp({ appId, path, private: isPrivate, remote, template });
}
