import { logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import { join, resolve } from 'path';

import { authenticate } from '../../lib/authentication';
import buildBlock from '../../lib/buildBlock';
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
    .option('build', {
      alias: 'b',
      describe: 'If specified, builds the block with webpack before publishing it.',
      type: 'boolean',
      default: true,
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

export async function handler({ all, build, clientCredentials, ignoreConflict, path, remote }) {
  await authenticate(remote, 'blocks:write', clientCredentials);
  const fullPath = resolve(process.cwd(), path);

  if (all) {
    const directories = (await fs.readdir(path)).filter(subDir =>
      fs.lstatSync(join(fullPath, subDir)).isDirectory(),
    );

    logger.info(`Registering ${directories.length} Blocks`);
    await directories.reduce(async (acc, subDir) => {
      await acc;

      const subPath = join(fullPath, subDir);
      const config = await getBlockConfig(subPath);

      if (build) {
        await buildBlock({
          path: resolve(subPath, 'dist'),
          config,
        });
      }

      await registerBlock({ path: subPath, ignoreConflict });
      logger.info(`Publishing ${config.id}@${config.version}…`);
      await publish({ config, ignoreConflict, path: subPath });
    }, {});

    return;
  }

  const config = await getBlockConfig(fullPath);

  if (build) {
    await buildBlock({
      path: resolve(join(fullPath, 'dist')),
      config,
    });
  }

  await registerBlock({ path: fullPath, ignoreConflict });
  logger.info(`Publishing ${config.id}@${config.version}…`);
  await publish({ config, ignoreConflict, path: fullPath });
}
