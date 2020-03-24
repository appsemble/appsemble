import { logger } from '@appsemble/node-utils';
import * as webpack from 'webpack';

import { BlockConfig } from '../types';
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
export default async function buildBlock({
  config,
  path,
}: BuildBlockParams): Promise<webpack.Stats> {
  const conf = await loadWebpackConfig(config, 'production', path);

  logger.info(`Building ${config.id}@${config.version} 🔨`);

  const compiler = webpack(conf);
  return new Promise((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      logger.verbose(stats.toString());
      resolve(stats);
    }),
  );
}
