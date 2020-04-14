import { AppsembleError, logger } from '@appsemble/node-utils';
import webpack, { Stats } from 'webpack';

import type { BlockConfig } from '../types';
import loadWebpackConfig from './loadWebpackConfig';

interface BuildBlockParams {
  /**
   * The config of the block to build.
   */
  config: BlockConfig;

  /**
   * The path of the block to build.
   */
  path: string;
}

/**
 * Builds a block using Webpack.
 */
export default async function buildBlock({ config, path }: BuildBlockParams): Promise<Stats> {
  const conf = await loadWebpackConfig(config, 'production', path);

  logger.info(`Building ${config.name}@${config.version} 🔨`);

  const compiler = webpack(conf);
  return new Promise((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors) {
        reject(new AppsembleError(stats.toString({ colors: true })));
      } else {
        logger.verbose(stats.toString({ colors: true }));
        resolve(stats);
      }
    }),
  );
}
