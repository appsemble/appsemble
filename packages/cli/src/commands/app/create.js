import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';

import { authenticate } from '../../lib/authentication';
import createApp from '../../lib/createApp';

export const command = 'create <paths...>';
export const description = 'Create a new App based on a specified YAML file or directory.';

export function builder(yargs) {
  return yargs
    .positional('paths', {
      describe: 'The paths to the apps to create.',
      normalize: true,
    })
    .option('organization', {
      describe: 'The ID the app should be created for.',
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

export async function handler({
  clientCredentials,
  organization,
  paths,
  private: isPrivate,
  remote,
  template,
}) {
  await authenticate(remote, 'apps:write', clientCredentials);
  const organizationId = organization.startsWith('@') ? organization.slice(1) : organization;

  const directories = await fg(paths, { absolute: true, onlyDirectories: true });

  logger.info(`Creating ${directories.length} Apps for @${organizationId}`);
  directories.reduce(async (acc, dir) => {
    await acc;
    await createApp({
      organizationId,
      path: dir,
      private: isPrivate,
      remote,
      template,
    });
  }, {});
}
