import * as path from 'path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import webpack, { Stats } from 'webpack';

import type { BlockConfig } from '../types';
import { loadWebpackConfig } from './loadWebpackConfig';

/**
 * Builds a block using Webpack.
 *
 * @param config - The config of the block to build.
 *
 * @returns The Webpack stats object.
 */
export async function buildBlock(config: BlockConfig): Promise<Stats> {
  const conf = await loadWebpackConfig(config, 'production', path.join(config.dir, config.output));

  logger.info(`Building ${config.name}@${config.version} 🔨`);

  const compiler = webpack(conf);
  return new Promise((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors()) {
        reject(new AppsembleError(stats.toString({ colors: true })));
      } else {
        logger.verbose(stats.toString({ colors: true }));
        resolve(stats);
      }
    }),
  );
}
