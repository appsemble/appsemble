import { logger } from '@appsemble/node-utils';

import { getToken } from '../../lib/config';
import getBlockConfig from '../../lib/getBlockConfig';
import publish from '../../lib/publish';

export const command = 'publish <path>';
export const description = 'Publish a new version of an existing block.';

export function builder(yargs) {
  return yargs
    .positional('path', {
      describe: 'The path to the block to register',
      normalize: true,
    })
    .option('ignore-conflict', {
      describe: 'If specified, conflicts with an existing block version are ignored.',
      type: 'boolean',
    });
}

export async function handler({ ignoreConflict, path, remote }) {
  await getToken(remote);
  const config = await getBlockConfig(path);
  logger.info(`Publishing ${config.id}@${config.version}`);
  await publish({ config, ignoreConflict, path });
}
