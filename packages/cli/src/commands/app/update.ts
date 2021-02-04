import { logger } from '@appsemble/node-utils';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { updateApp } from '../../lib/updateApp';
import { BaseArguments } from '../../types';

interface UpdateAppArguments extends BaseArguments {
  context: string;
  path: string;
  id: number;
  private: boolean;
  template: boolean;
}

export const command = 'update <path>';
export const description = 'Updated a new App based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('path', {
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
  path,
  private: isPrivate,
  remote,
  template,
}: UpdateAppArguments): Promise<void> {
  logger.info(`Updating App ${id}`);
  await updateApp({
    clientCredentials,
    context,
    id,
    path: normalizePath(path),
    private: isPrivate,
    remote,
    template,
  });
}
