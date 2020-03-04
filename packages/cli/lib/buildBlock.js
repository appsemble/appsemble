import { logger } from '@appsemble/node-utils';
import webpack from 'webpack';

import loadWebpackConfig from './loadWebpackConfig';

/**
 * Builds a block using Webpack.
 *
 * @param {object} params
 * @param {string} params.path The path of the block to build.
 * @param {string} params.webpackConfig The path of the webpack config to use.
 * @param {string} params.config The config of the block to build.
 */
export default async function buildBlock({ config, path }) {
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
