import path from 'path';

/**
 * Load a webpack configuration file.
 *
 * A webpack configuration file may export either an webpack configuration object, or a synchronous
 * or asynchronous function which returns a webpack configuration object. This function supports
 * all 3 use cases.
 *
 * @param {string} configPath The path to the webpack configuration file.
 * @param {string} env The env that would be passed to webpack by invoking `webpack --env $env`.
 * @param {Object} argv The arguments object that would be passed to the function by the webpack
 *   CLI.
 * @returns {Object} The webpack configuration as exposed by the webpack configuration file.
 */
export default async function loadWebpackConfig(configPath, env, argv) {
  const { default: maybeFn } = await import(path.resolve(configPath));
  const config = maybeFn instanceof Function ? await maybeFn(env, argv) : maybeFn;
  // koa-webpack serves assets on the `output.path` path. Normally this field describes where to
  // output the files on the file system. This is monkey patched to support usage with our dev
  // server.
  config.output.path = argv.publicPath;
  config.output.publicPath = argv.publicPath;
  return config;
}
