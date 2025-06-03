import { type ReadStream } from 'node:fs';

import { logger } from '@appsemble/node-utils';
import { type AppVisibility } from '@appsemble/types';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { publishApp } from '../../lib/app.js';
import { coerceFile } from '../../lib/coercers.js';
import { type BaseArguments } from '../../types.js';

interface PublishAppArguments extends BaseArguments {
  context: string;
  icon: NodeJS.ReadStream | ReadStream;
  iconBackground: string;
  maskableIcon: NodeJS.ReadStream | ReadStream;
  paths: string[];
  organization: string;
  template: boolean;
  demoMode: boolean;
  seed: boolean;
  dryRun: boolean;
  resources: boolean;
  assets: boolean;
  assetsClonable: boolean;
  modifyContext: boolean;
  visibility: AppVisibility;
  sentryDsn: string;
  sentryEnvironment: string;
  googleAnalyticsId: string;
  dbName: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
}

export const command = 'publish <paths...>';
export const description =
  'Publish a new App to a remote based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('paths', {
      describe: 'The paths to the apps to publish.',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
    })
    .option('organization', {
      describe: 'The organization ID the app should be published under.',
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
    })
    .option('demo-mode', {
      describe: 'Whether the app should be used in demo mode.',
      type: 'boolean',
    })
    .option('dry-run', {
      describe: 'Whether the API should be called to run without actually creating the app.',
      type: 'boolean',
    })
    .option('resources', {
      describe:
        'Whether the resources from the `resources` directory should be created after publishing the app. The names of sub-directories are used as the name of the resource, otherwise the names of top level resource .json files are used instead.',
      type: 'boolean',
    })
    .option('members', {
      describe: '',
      type: 'boolean',
    })
    .option('assets', {
      describe:
        'Whether the assets from the `assets` directory should be created after publishing the app.',
      type: 'boolean',
      default: false,
    })
    .option('assets-clonable', {
      describe: 'Whether published assets should be clonable. Ignored if assets equals false.',
      type: 'boolean',
      default: false,
      implies: 'assets',
    })
    .option('modify-context', {
      describe:
        'If the app context is specified, modify it for the current context to include the id of the published app.',
      type: 'boolean',
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

export async function handler({ paths, ...args }: PublishAppArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });

  logger.info(`Publishing ${directories.length} apps`);
  for (const dir of directories) {
    logger.info('');
    await publishApp({
      ...args,
      path: dir,
    });
  }
}
