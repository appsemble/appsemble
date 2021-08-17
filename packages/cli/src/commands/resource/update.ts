import { join } from 'path';

import { AppsembleError, logger, readData } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { updateResource } from '../../lib/resource';
import { AppsembleRC, BaseArguments } from '../../types';

interface CreateResourceArguments extends BaseArguments {
  resourceName: string;
  paths: string[];
  appId: number;
  context: string;
  app: string;
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
      describe: 'The ID of the app to create the resources for.',
      type: 'number',
      conflicts: 'app',
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
  let id: number;
  let resolvedRemote = remote;

  if (app) {
    const [rc] = await readData<AppsembleRC>(join(app, '.appsemblerc.yaml'));
    if (rc.context?.[context]?.id) {
      id = Number(rc?.context?.[context]?.id);
    } else {
      throw new AppsembleError(
        `App ID was not found in ${join(app, '.appsemblerc.yaml')} context.${context}.id`,
      );
    }

    if (rc.context?.[context]?.remote) {
      resolvedRemote = rc.context?.[context]?.remote;
    }
  } else {
    id = appId;
  }

  await authenticate(resolvedRemote, 'resources:write', clientCredentials);

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
      appId: id,
      path,
      remote: resolvedRemote,
    });
  }
}
