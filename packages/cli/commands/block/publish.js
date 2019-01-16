import logging from 'winston';

import getConfig from '../../lib/getConfig';
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

export async function handler({ ignoreConflict, path }) {
  const config = await getConfig(path);
  logging.info(`Publishing ${config.id}@${config.version}`);
  await publish({ config, ignoreConflict, path });
}
