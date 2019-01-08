import logging from 'winston';

import getConfig from '../../lib/getConfig';
import publish from '../../lib/publish';

export const command = 'publish <path>';
export const description = 'Publish a new version of an existing block.';

export function builder(yargs) {
  return yargs.positional('path', {
    describe: 'The path to the block to register',
    normalize: true,
  });
}

export async function handler({ path }) {
  const config = await getConfig(path);
  logging.info(`Publishing ${config.id}@${config.version}`);
  await publish({ config, path });
}
