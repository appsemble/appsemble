import { parse } from 'node:path';

import { AppsembleError, authenticate, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { publishAsset } from '../../lib/asset.js';
import { type BaseArguments } from '../../types.js';

interface PublishAssetArguments extends BaseArguments {
  name: string;
  useFileName: boolean;
  paths: string[];
  appId: number;
  context: string;
  app: string;
  clonable: boolean;
  seed: boolean;
}

export const command = 'publish <paths...>';
export const description = 'Publish assets for an existing app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('paths', {
      describe: 'The path to the resources to publish',
      normalize: true,
      demandOption: true,
    })
    .option('name', {
      describe:
        'The name that should be assigned to the asset. These must be unique. Will override `--use-file-name`.',
    })
    .option('use-file-name', {
      describe:
        'Whether the filename should be used as the name to refer the asset to. If this is set to false and `--name` is not specified, no name will be set.',
      type: 'boolean',
      default: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to publish the resources for.',
      type: 'number',
    })
    .option('app', {
      describe: 'The path to the app.',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
    })
    .option('clonable', {
      type: 'boolean',
      default: false,
      describe: 'If true, all published assets will be clonable',
    })
    .option('seed', {
      describe: 'If true, published resources will be used as seed',
      default: false,
    });
}

export async function handler({
  app,
  appId,
  clientCredentials,
  clonable,
  context,
  name,
  paths,
  remote,
  seed,
  useFileName,
}: PublishAssetArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);
  await authenticate(resolvedRemote, 'assets:write', clientCredentials);

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });

  if (name && files.length > 1) {
    throw new AppsembleError('--name was specified but multiple files were found.');
  }

  logger.info(`Publishing ${files.length} asset(s)`);
  for (const path of files) {
    logger.info('');
    await publishAsset({
      name: name || (useFileName ? parse(path).name : undefined),
      appId: resolvedAppId,
      path,
      seed,
      remote: resolvedRemote,
      clonable,
    });
  }
}
