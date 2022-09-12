import { AppsembleError, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { authenticate } from '../../lib/authentication.js';
import { createResource } from '../../lib/resource.js';
import { BaseArguments } from '../../types.js';

interface CreateResourceArguments extends BaseArguments {
  resourceName: string;
  paths: string[];
  appId: number;
  context: string;
  app: string;
}

export const command = 'create <resource-name> <paths...>';
export const description = 'Create resources based on a specified JSON file or directory.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('resource-name', {
      describe: 'The name of the resource that should be created.',
      demandOption: true,
    })
    .positional('paths', {
      describe: 'The path to the resources to create',
      normalize: true,
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to create the resources for.',
      type: 'number',
    })
    .option('app', {
      describe: 'The path to the app.',
      demandOption: 'context',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
      demandOption: 'app',
    });
}

export async function handler({
  app,
  appId,
  clientCredentials,
  context,
  paths,
  remote,
  resourceName,
}: CreateResourceArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);
  await authenticate(resolvedRemote, 'resources:write', clientCredentials);

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const files = (await fg(normalizedPaths, { absolute: true, onlyFiles: true })).filter(
    (file) => file.endsWith('.json') || file.endsWith('.csv'),
  );

  if (!files.length) {
    throw new AppsembleError('No .json or .csv files found.');
  }

  logger.info(`Creating resources based on ${files.length} files`);
  for (const path of files) {
    logger.info('');
    await createResource({
      resourceName,
      appId: resolvedAppId,
      path,
      remote: resolvedRemote,
    });
  }
}
