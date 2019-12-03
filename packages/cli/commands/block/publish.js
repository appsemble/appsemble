import { logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import { join, resolve } from 'path';

import buildBlock from '../../lib/buildBlock';
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
    .option('webpack-config-path', {
      desc: 'The webpack configuration file to use for blocks.',
      alias: 'c',
      default: 'webpack.config',
      normalize: true,
    })
    .option('build', {
      alias: 'b',
      describe: 'If specified, builds the block with webpack before publishing it.',
      type: 'boolean',
    })
    .option('ignore-conflict', {
      describe: 'If specified, conflicts with an existing block version are ignored.',
      type: 'boolean',
    })
    .option('all', {
      alias: 'a',
      describe: 'Perform this command on every directory that is a subdirectory of the given path.',
      type: 'boolean',
    });
}

export async function handler({ build, webpackConfigPath, ignoreConflict, path, remote, all }) {
  await getToken(remote);

  if (all) {
    const directories = (await fs.readdir(path)).filter(subDir =>
      fs.lstatSync(join(path, subDir)).isDirectory(),
    );

    logger.info(`Publishing ${directories.length} Blocks`);
    directories.reduce(async (acc, subDir) => {
      await acc;

      const subPath = join(__dirname, path, subDir);
      const config = await getBlockConfig(subPath);

      if (build) {
        await buildBlock({ path: resolve(join(subPath, 'dist')), webpackConfigPath, config });
      }

      logger.info(`Publishing ${config.id}@${config.version}…`);
      await publish({ config, ignoreConflict, path: subPath });
    }, {});

    return;
  }

  const config = await getBlockConfig(path);
  if (build) {
    await buildBlock({ path: resolve(join(path, 'dist')), webpackConfigPath, config });
  }

  logger.info(`Publishing ${config.id}@${config.version}`);
  await publish({ config, ignoreConflict, path });
}
