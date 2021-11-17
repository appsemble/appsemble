import { ReadStream } from 'fs';

import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { createApp } from '../../lib/app';
import { coerceFile } from '../../lib/coercers';
import { BaseArguments } from '../../types';

interface CreateAppArguments extends BaseArguments {
  context: string;
  icon: NodeJS.ReadStream | ReadStream;
  iconBackground: string;
  maskableIcon: NodeJS.ReadStream | ReadStream;
  paths: string[];
  organization: string;
  listed: boolean;
  template: boolean;
  dryRun: boolean;
  resources: boolean;
  modifyContext: boolean;
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
    .option('listed', {
      describe: 'Whether the app should be listed in the public app store.',
      type: 'boolean',
    })
    .option('template', {
      describe: 'Whether the app should be marked as a template.',
      type: 'boolean',
    })
    .option('dry-run', {
      describe: 'Whether the API should be called to run without actually creating the app.',
      type: 'boolean',
    })
    .option('resources', {
      describe:
        'Whether the resources from the `resources` directory should be created after creating the app. The names of subdirectories are used as the name of the resource, otherwise the names of top level resource .json files are used instead.',
      type: 'boolean',
    })
    .option('modify-context', {
      describe:
        'If the app context is specified, modify it for the current context to include the id of the created app.',
      type: 'boolean',
    });
}

export async function handler({
  clientCredentials,
  context,
  dryRun,
  icon,
  iconBackground,
  listed,
  maskableIcon,
  modifyContext,
  organization,
  paths,
  remote,
  resources,
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
      icon,
      iconBackground,
      listed,
      maskableIcon,
      remote,
      template,
      dryRun,
      resources,
      modifyContext,
    });
  }
}
