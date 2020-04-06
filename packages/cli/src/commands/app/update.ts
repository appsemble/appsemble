import { logger } from '@appsemble/node-utils';
import type { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import updateApp from '../../lib/updateApp';
import type { BaseArguments } from '../../types';

interface CreateAppArguments extends BaseArguments {
  path: string;
  appId: number;
  private: boolean;
  template: boolean;
}

export const command = 'update <path>';
export const description = 'Updated a new App based on a specified YAML file or directory.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('path', {
      describe: 'The path to the app to register',
      normalize: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to update.',
      demand: true,
      type: 'number',
    })
    .option('private', {
      describe: 'Whether the app should be marked as private.',
      default: true,
      type: 'boolean',
    })
    .option('template', {
      describe: 'Whether the app should be marked as a template.',
      default: false,
      type: 'boolean',
    });
}

export async function handler({
  appId,
  clientCredentials,
  path,
  private: isPrivate,
  remote,
  template,
}: CreateAppArguments): Promise<void> {
  await authenticate(remote, 'apps:write', clientCredentials);
  logger.info(`Updating App ${appId}`);
  await updateApp({ appId, path, private: isPrivate, remote, template });
}
