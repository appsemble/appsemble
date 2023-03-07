import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import { logger } from '@appsemble/node-utils';
import { BlockConfig } from '@appsemble/types';
import { Configuration } from 'webpack';

/**
 * Load a webpack configuration file.
 *
 * A webpack configuration file may export either an webpack configuration object, or a synchronous
 * or asynchronous function which returns a webpack configuration object. This function supports
 * all 3 use cases.
 *
 * @param block The path to the webpack configuration file.
 * @param mode The env that would be passed to webpack by invoking `webpack --env $env`.
 * @param outputPath The path where the build will be output on disk.
 * @returns The webpack configuration as exposed by the webpack configuration file.
 */
export async function loadWebpackConfig(
  block: BlockConfig,
  mode?: 'development' | 'production',
  outputPath?: string,
): Promise<Configuration> {
  let configPath: string;
  if (block.webpack) {
    configPath = join(block.dir, block.webpack);
  } else {
    configPath = join(block.dir, 'webpack.config.js');
    try {
      await stat(configPath);
    } catch {
      configPath = '@appsemble/webpack-config';
    }
  }
  logger.info(`Using webpack config from ${configPath}`);
  const publicPath = `/api/blocks/${block.name}/versions/${block.version}/`;
  let config = await import(String(configPath));
  config = await (config.default || config);
  config = config instanceof Function ? await config(block, { mode, publicPath }) : config;

  // Koa-webpack serves assets on the `output.path` path. Normally this field describes where to
  // output the files on the file system. This is monkey patched to support usage with our dev
  // server.
  config.output = config.output || {};
  config.output.path = outputPath || publicPath;
  logger.verbose(`Patched webpack config output.path to ${config.output.path}`);
  config.output.publicPath = publicPath;
  logger.verbose(`Patched webpack config output.publicPath to ${config.output.publicPath}`);

  return config;
}
