import { logger } from '@appsemble/node-utils';
import webpack from 'webpack';
import merge from 'webpack-merge';

import loadWebpackConfig from './loadWebpackConfig';

/**
 * Builds a block using Webpack.
 *
 * @param {object} params
 * @param {string} params.path The path of the block to build.
 * @param {string} params.webpackConfig The path of the webpack config to use.
 * @param {string} params.config The config of the block to build.
 */
export default async function buildBlock({ path, webpackConfig, config }) {
  const conf = merge.smart(
    await loadWebpackConfig(webpackConfig, config.id, {
      mode: 'production',
      publicPath: `/api/blocks/${config.id}/versions/${config.version}`,
    }),
    {
      output: {
        path,
      },
    },
  );

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
