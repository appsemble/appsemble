import { type ReadStream } from 'node:fs';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { type AppVisibility } from '@appsemble/types';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { updateApp } from '../../lib/app.js';
import { coerceFile } from '../../lib/coercers.js';
import { type BaseArguments } from '../../types.js';

interface UpdateAppArguments extends BaseArguments {
  context: string;
  paths: string[];
  icon: NodeJS.ReadStream | ReadStream;
  iconBackground: string;
  maskableIcon: NodeJS.ReadStream | ReadStream;
  id: number;
  template: boolean;
  demoMode: boolean;
  resources: boolean;
  assets: boolean;
  assetsClonable: boolean;
  force: boolean;
  visibility: AppVisibility;
  sentryDsn: string;
  sentryEnvironment: string;
  googleAnalyticsId: string;
  metaPixelId: string;
  msClarityId: string;
  dbName: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
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
    .option('variant', {
      describe: 'The shared variant to use instead.',
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
    .option('demo-mode', {
      describe: 'Whether the app should be used in demo mode.',
      type: 'boolean',
    })
    .option('resources', {
      describe:
        'Whether the resources from the `resources` directory should replace the seed resources of the app being updated. The names of sub-directories are used as the name of the resource, otherwise the names of top level resource .json files are used instead.',
      type: 'boolean',
    })
    .option('members', {
      describe: '',
      type: 'boolean',
    })
    .option('assets', {
      describe:
        'Whether the assets from the `assets` directory should replace the seed assets of the app being updated.',
      type: 'boolean',
      default: false,
    })
    .option('assets-clonable', {
      describe: 'Whether published assets should be clonable. Ignored if assets equals false.',
      type: 'boolean',
      default: false,
      implies: 'assets',
    })
    .option('force', {
      describe: 'Whether the lock property should be ignored.',
      type: 'boolean',
      default: false,
    })
    .option('google-analytics-id', {
      describe: 'The ID for Google Analytics for the app.',
    })
    .option('meta-pixel-id', {
      describe: 'The ID for Meta Pixel for the app.',
    })
    .option('ms-clarity-id', {
      describe: 'The ID for MS Clarity for the app.',
    })
    .option('sentry-dsn', {
      describe: 'The custom Sentry DSN for the app.',
    })
    .option('sentry-environment', {
      describe: 'The environment for the custom Sentry DSN for the app.',
      implies: ['sentry-dsn'],
    })
    .option('db-name', {
      describe: 'The name of the external app database.',
    })
    .option('db-host', {
      describe: 'The host of the external app database.',
    })
    .option('db-port', {
      describe: 'The port of the external app database.',
      type: 'number',
    })
    .option('db-user', {
      describe: 'The user of the external app database.',
    })
    .option('db-password', {
      describe: 'The password of the external app database.',
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

  logger.info(`Updating ${directories.length} apps`);
  for (const dir of directories) {
    await updateApp({
      ...args,
      clientCredentials: clientCredentials ?? '',
      id,
      path: dir,
      remote,
    });
  }
}
