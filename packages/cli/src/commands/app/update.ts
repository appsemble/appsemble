import { ReadStream } from 'fs';

import { AppsembleError, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { updateApp } from '../../lib/app';
import { authenticate } from '../../lib/authentication';
import { coerceFile } from '../../lib/coercers';
import { BaseArguments } from '../../types';

interface UpdateAppArguments extends BaseArguments {
  context: string;
  paths: string[];
  icon: NodeJS.ReadStream | ReadStream;
  iconBackground: string;
  maskableIcon: NodeJS.ReadStream | ReadStream;
  id: number;
  private: boolean;
  template: boolean;
  force: boolean;
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
    .option('icon', {
      describe: 'The icon to upload. By default "icon.png" in the app directory is used.',
      coerce: coerceFile,
    })
    .option('icon-background', {
      describe: 'The background color to use for the icon in opaque contexts.',
      default: '#ffffff',
    })
    .option('maskable-icon', {
      describe:
        'The maskable icon to upload. By default "maskable-icon.png" in the app directory is used.',
      coerce: coerceFile,
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
    })
    .option('force', {
      describe: 'Whether the lock property should be ignored.',
      default: false,
      type: 'boolean',
    });
}

export async function handler({
  clientCredentials,
  context,
  force,
  icon,
  iconBackground,
  id,
  maskableIcon,
  paths,
  private: isPrivate,
  remote,
  template,
}: UpdateAppArguments): Promise<void> {
  if (id != null && paths.length > 1) {
    throw new AppsembleError('Only one path may be specified when specifying an app id');
  }

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });

  await authenticate(remote, 'apps:write', clientCredentials);

  logger.info(`Updating ${directories.length} apps`);
  for (const dir of directories) {
    await updateApp({
      clientCredentials,
      context,
      id,
      path: dir,
      maskableIcon,
      private: isPrivate,
      remote,
      icon,
      iconBackground,
      template,
      force,
    });
  }
}
