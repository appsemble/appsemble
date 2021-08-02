import { AppsembleError, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { updateResource } from '../../lib/updateResource';
import { BaseArguments } from '../../types';

interface CreateResourceArguments extends BaseArguments {
  resourceName: string;
  paths: string[];
  appId: number;
}

export const command = 'update <resource-name> <paths...>';
export const description =
  'Update resources based on a specified JSON file or directory. Entries without the property `id` will be skipped.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('resource-name', {
      describe: 'The name of the resource that should be created.',
      demandOption: true,
    })
    .positional('paths', {
      describe: 'The path to the resources to update',
      normalize: true,
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to update the resources of.',
      type: 'number',
      demandOption: true,
    });
}

export async function handler({
  appId,
  clientCredentials,
  paths,
  remote,
  resourceName,
}: CreateResourceArguments): Promise<void> {
  await authenticate(remote, 'resources:write', clientCredentials);

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });

  if (!files.length) {
    throw new AppsembleError('No JSON files found.');
  }

  logger.info(`Updating resources based on ${files.length} files`);
  for (const path of files) {
    logger.info('');
    await updateResource({
      resourceName,
      appId,
      path,
      remote,
    });
  }
}
