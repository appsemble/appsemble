import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { createApp } from '../../lib/createApp';
import { BaseArguments } from '../../types';

interface CreateAppArguments extends BaseArguments {
  paths: string[];
  organization: string;
  private: boolean;
  template: boolean;
}

export const command = 'create <paths...>';
export const description = 'Create a new App based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('paths', {
      describe: 'The paths to the apps to create.',
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
}: CreateAppArguments): Promise<void> {
  await authenticate(remote, 'apps:write', clientCredentials);
  const organizationId = organization.startsWith('@') ? organization.slice(1) : organization;

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });

  logger.info(`Creating ${directories.length} Apps for @${organizationId}`);
  for (const dir of directories) {
    logger.info('');
    await createApp({
      organizationId,
      path: dir,
      private: isPrivate,
      remote,
      template,
    });
  }
}
