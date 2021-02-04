import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { createApp } from '../../lib/createApp';
import { BaseArguments } from '../../types';

interface CreateAppArguments extends BaseArguments {
  context: string;
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
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
    })
    .option('organization', {
      describe: 'The ID the app should be created for.',
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
  context,
  organization,
  paths,
  private: isPrivate,
  remote,
  template,
}: CreateAppArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });

  logger.info(`Creating ${directories.length} apps`);
  for (const dir of directories) {
    logger.info('');
    await createApp({
      clientCredentials,
      context,
      organization,
      path: dir,
      private: isPrivate,
      remote,
      template,
    });
  }
}
