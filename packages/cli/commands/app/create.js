import { logger } from '@appsemble/node-utils';

import { getToken } from '../../lib/config';
import createApp from '../../lib/createApp';

export const command = 'create <path>';
export const description = 'Create a new App based on a specified YAML file or directory.';

export function builder(yargs) {
  return yargs
    .positional('path', {
      describe: 'The path to the app to register',
      normalize: true,
    })
    .option('organization', {
      describe: 'The ID the app should be created for.',
      demand: true,
    })
    .option('private', {
      describe: 'Whether the App should be marked as private.',
      default: true,
      type: 'boolean',
    })
    .option('template', {
      describe: 'Whether the App should be marked as a template.',
      default: false,
      type: 'boolean',
    });
}

export async function handler({ organization, path, private: isPrivate, remote, template }) {
  await getToken(remote);
  const organizationId = organization.startsWith('@') ? organization.slice(1) : organization;
  logger.info(`Creating App for @${organizationId}`);
  await createApp({ organizationId, path, private: isPrivate, remote, template });
}
