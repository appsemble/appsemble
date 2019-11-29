import { logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import { join } from 'path';

import { getToken } from '../../lib/config';
import getBlockConfig from '../../lib/getBlockConfig';
import publish from '../../lib/publish';
import registerBlock from '../../lib/registerBlock';

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
    })
    .option('all', {
      alias: 'a',
      describe: 'Perform this command on every directory that is a subdirectory of the given path.',
      type: 'boolean',
    });
}

export async function handler({ ignoreConflict, path, remote, all }) {
  await getToken(remote);

  if (all) {
    const directories = (await fs.readdir(path)).filter(subDir =>
      fs.lstatSync(join(path, subDir)).isDirectory(),
    );

    logger.info(`Registering ${directories.length} Blocks`);
    directories.reduce(async (acc, subDir) => {
      await acc;

      const subPath = join(path, subDir);

      const config = await getBlockConfig(subPath);
      await registerBlock({ path: subPath, ignoreConflict });
      logger.info(`Publishing ${config.id}@${config.version}…`);
      await publish({ config, ignoreConflict, path: subPath });
    }, {});

    return;
  }

  const config = await getBlockConfig(path);
  await registerBlock({ path, ignoreConflict });
  logger.info(`Publishing ${config.id}@${config.version}…`);
  await publish({ config, ignoreConflict, path });
}
