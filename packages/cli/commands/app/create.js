import { logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import { join } from 'path';

import { authenticate } from '../../lib/authentication';
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
    })
    .option('all', {
      alias: 'a',
      describe: 'Perform this command on every directory that is a subdirectory of the given path.',
      default: false,
      type: 'boolean',
    });
}

export async function handler({
  all,
  clientCredentials,
  organization,
  path,
  private: isPrivate,
  remote,
  template,
}) {
  await authenticate(remote, 'apps:write', clientCredentials);
  const organizationId = organization.startsWith('@') ? organization.slice(1) : organization;

  if (all) {
    const directories = (await fs.readdir(path)).filter(subDir =>
      fs.lstatSync(join(path, subDir)).isDirectory(),
    );

    logger.info(`Creating ${directories.length} Apps for @${organizationId}`);
    directories.reduce(async (acc, subDir) => {
      await acc;
      await createApp({
        organizationId,
        path: join(path, subDir),
        private: isPrivate,
        remote,
        template,
      });
    }, {});

    return;
  }

  logger.info(`Creating App for @${organizationId}`);
  await createApp({ organizationId, path, private: isPrivate, remote, template });
}
