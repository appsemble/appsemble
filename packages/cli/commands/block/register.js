import { logger } from '@appsemble/node-utils';

import { getToken } from '../../lib/config';
import getBlockConfig from '../../lib/getBlockConfig';
import publish from '../../lib/publish';
import { post } from '../../lib/request';

export const command = 'register <path>';
export const description = 'Register a new Appsemble block.';

export function builder(yargs) {
  return yargs
    .positional('path', {
      describe: 'The path to the block to register',
      normalize: true,
    })
    .option('ignore-conflict', {
      describe: 'If specified, conflicts with an existing block or block version are ignored.',
      type: 'boolean',
    });
}

export async function handler({ ignoreConflict, path, remote }) {
  await getToken(remote);
  const config = await getBlockConfig(path);
  logger.info(`Registering block ${config.id}`);
  const { description: desc, id } = config;
  try {
    await post('/api/blocks', { description: desc, id });
    logger.info(`Registration of ${config.id} successful! 🎉`);
  } catch (err) {
    if (!ignoreConflict || !err.request || err.response.status !== 409) {
      throw err;
    }
    logger.warn(`${config.id} was already registered.`);
  }
  logger.info(`Publishing ${config.id}@${config.version}…`);
  await publish({ config, ignoreConflict, path });
}
