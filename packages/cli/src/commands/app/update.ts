import { AppsembleError, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { updateApp } from '../../lib/updateApp';
import { BaseArguments } from '../../types';

interface UpdateAppArguments extends BaseArguments {
  context: string;
  paths: string[];
  id: number;
  private: boolean;
  template: boolean;
}

export const command = 'update <paths...>';
export const description = 'Update an app based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('paths', {
      describe: 'The path to the app to register',
      normalize: true,
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
    })
    .option('id', {
      describe: 'The ID of the app to update.',
      type: 'number',
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
  id,
  paths,
  private: isPrivate,
  remote,
  template,
}: UpdateAppArguments): Promise<void> {
  if (id != null && paths.length) {
    throw new AppsembleError('Only one path may be specified when specifying an app id');
  }

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });

  logger.info(`Updating ${directories.length} apps`);
  for (const dir of directories) {
    await updateApp({
      clientCredentials,
      context,
      id,
      path: dir,
      private: isPrivate,
      remote,
      template,
    });
  }
}
