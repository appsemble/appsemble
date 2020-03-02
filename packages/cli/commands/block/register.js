import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import { resolve } from 'path';

import { authenticate } from '../../lib/authentication';
import buildBlock from '../../lib/buildBlock';
import getBlockConfig from '../../lib/getBlockConfig';
import publish from '../../lib/publish';
import registerBlock from '../../lib/registerBlock';

export const command = 'register <paths...>';
export const description = 'Register a new Appsemble block.';

export function builder(yargs) {
  return yargs
    .positional('paths', {
      describe: 'The path to the block to register.',
      normalize: true,
    })
    .option('build', {
      alias: 'b',
      describe: 'If specified, builds the block with webpack before publishing it.',
      type: 'boolean',
      default: true,
    })
    .option('ignore-conflict', {
      describe: 'If specified, conflicts with an existing block or block version are ignored.',
      type: 'boolean',
    });
}

export async function handler({ build, clientCredentials, ignoreConflict, paths, remote }) {
  await authenticate(remote, 'blocks:write', clientCredentials);
  const directories = await fg(paths, { absolute: true, onlyDirectories: true });

  logger.info(`Registering ${directories.length} Blocks`);
  await directories.reduce(async (acc, dir) => {
    await acc;

    const config = await getBlockConfig(dir);

    if (build) {
      await buildBlock({
        path: resolve(dir, config.dist),
        config,
      });
    }

    await registerBlock({ path: dir, ignoreConflict });
    logger.info(`Publishing ${config.id}@${config.version}…`);
    await publish({ config, ignoreConflict, path: dir });
  }, {});
}
