import { join } from 'path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { pathExists, remove } from 'fs-extra';
import webpack, { Stats } from 'webpack';

import { BlockConfig } from '../types';
import { loadWebpackConfig } from './loadWebpackConfig';

/**
 * Builds a block using Webpack.
 *
 * @param config - The config of the block to build.
 *
 * @returns The Webpack stats object.
 */
export async function buildBlock(config: BlockConfig): Promise<Stats> {
  const conf = await loadWebpackConfig(config, 'production', join(config.dir, config.output));

  if (await pathExists(conf.output.path)) {
    logger.warn(`Removing ${conf.output.path}`);
    await remove(conf.output.path);
  }
  logger.info(`Building ${config.name}@${config.version} 🔨`);

  const compiler = webpack(conf);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors()) {
        reject(new AppsembleError(stats.toString({ colors: true })));
      } else {
        logger.verbose(stats.toString({ colors: true }));
        resolve(stats);
      }
    });
  });
}
