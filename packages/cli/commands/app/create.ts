import { type ReadStream } from 'node:fs';

import { logger } from '@appsemble/node-utils';
import { type AppVisibility } from '@appsemble/types';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { createApp } from '../../lib/app.js';
import { coerceFile } from '../../lib/coercers.js';
import { type BaseArguments } from '../../types.js';

interface CreateAppArguments extends BaseArguments {
  context: string;
  icon: NodeJS.ReadStream | ReadStream;
  iconBackground: string;
  maskableIcon: NodeJS.ReadStream | ReadStream;
  paths: string[];
  organization: string;
  template: boolean;
  dryRun: boolean;
  resources: boolean;
  modifyContext: boolean;
  visibility: AppVisibility;
  sentryDsn: string;
  sentryEnvironment: string;
  googleAnalyticsId: string;
}

export const command = 'create <paths...>';
export const description = 'Create a new App based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv<any> {
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
    .option('visibility', {
      describe: 'Visibility of the app in the public app store.',
      default: 'unlisted',
      choices: ['public', 'unlisted', 'private'],
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

export async function handler({ paths, ...args }: CreateAppArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });

  logger.info(`Creating ${directories.length} apps`);
  for (const dir of directories) {
    logger.info('');
    await createApp({
      ...args,
      path: dir,
    });
  }
}
