import { AppsembleError, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { createResource } from '../../lib/createResource';
import { BaseArguments } from '../../types';

interface CreateResourceArguments extends BaseArguments {
  resourceName: string;
  paths: string[];
  appId: number;
}

export const command = 'create <resource-name> <paths...>';
export const description = 'Create resources based on a specified JSON file or directory.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('resource-name', {
      type: 'string',
      describe: 'The name of the resource that should be created.',
    })
    .positional('paths', {
      describe: 'The path to the resources to create',
      normalize: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to create the resources for.',
      type: 'number',
    })
    .demandOption(
      ['app-id', 'resource-name', 'paths'],
      'Please provide an app id, resource name and a path to at least one json file.',
    );
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
  const files = (await fg(normalizedPaths, { absolute: true, onlyFiles: true })).filter((file) =>
    file.endsWith('.json'),
  );

  if (!files.length) {
    throw new AppsembleError('No JSON files found.');
  }

  logger.info(`Creating ${files.length} resources`);
  for (const path of files) {
    logger.info('');
    await createResource({
      resourceName,
      appId,
      path,
      remote,
    });
  }
}
