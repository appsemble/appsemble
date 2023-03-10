import { parse } from 'node:path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { createAsset } from '../../lib/asset.js';
import { authenticate } from '../../lib/authentication.js';
import { BaseArguments } from '../../types.js';

interface CreateAssetArguments extends BaseArguments {
  name: string;
  useFileName: boolean;
  paths: string[];
  appId: number;
  context: string;
  app: string;
}

export const command = 'create <paths...>';
export const description = 'Create assets for an existing app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('paths', {
      describe: 'The path to the resources to create',
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
      describe: 'The ID of the app to create the resources for.',
      type: 'number',
    })
    .option('app', {
      describe: 'The path to the app.',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
    });
}

export async function handler({
  app,
  appId,
  clientCredentials,
  context,
  name,
  paths,
  remote,
  useFileName,
}: CreateAssetArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);
  await authenticate(resolvedRemote, 'assets:write', clientCredentials);

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });

  if (name && files.length > 1) {
    throw new AppsembleError('--name was specified but multiple files were found.');
  }

  logger.info(`Creating ${files.length} asset(s)`);
  for (const path of files) {
    logger.info('');
    await createAsset({
      name: name || (useFileName ? parse(path).name : null),
      appId: resolvedAppId,
      path,
      remote: resolvedRemote,
    });
  }
}
