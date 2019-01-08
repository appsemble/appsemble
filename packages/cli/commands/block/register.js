import logging from 'winston';

import getConfig from '../../lib/getConfig';
import publish from '../../lib/publish';
import { post } from '../../lib/request';

export const command = 'register <path>';
export const description = 'Register a new Appsemble block.';

export function builder(yargs) {
  return yargs.positional('path', {
    describe: 'The path to the block to register',
    normalize: true,
  });
}

export async function handler({ path }) {
  const config = await getConfig(path);
  logging.info(`Registering block ${config.id}`);
  const { description: desc, id } = config;
  await post('/api/blocks', { description: desc, id });
  logging.info(`Registration of ${config.id} successful! 🎉`);
  logging.info(`Publishing ${config.id}@${config.version}…`);
  await publish({ config, path });
}
