import { ReadStream } from 'fs';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { AppVisibility } from '@appsemble/types';
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
  template: boolean;
  force: boolean;
  visibility: AppVisibility;
  sentryDsn: string;
  sentryEnvironment: string;
  googleAnalyticsId: string;
}

export const command = 'update <paths...>';
export const description = 'Update an app based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv<any> {
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
    .option('visibility', {
      describe: 'Visibility of the app in the public app store.',
      default: 'unlisted',
      choices: ['public', 'unlisted', 'private'],
    })
    .option('template', {
      describe: 'Whether the app should be marked as a template.',
      type: 'boolean',
      default: false,
    })
    .option('force', {
      describe: 'Whether the lock property should be ignored.',
      type: 'boolean',
      default: false,
    })
    .option('google-analytics-id', {
      describe: 'The ID for Google Analytics for the app.',
    })
    .option('sentry-dsn', {
      describe: 'The custom Sentry DSN for the app.',
    })
    .option('sentry-environment', {
      describe: 'The environment for the custom Sentry DSN for the app.',
      implies: ['sentry-dsn'],
    });
}

export async function handler({
  clientCredentials,
  id,
  paths,
  remote,
  ...args
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
      ...args,
      clientCredentials,
      id,
      path: dir,
      remote,
    });
  }
}
