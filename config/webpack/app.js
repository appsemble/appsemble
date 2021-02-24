const { join } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

const minify = require('./html-minifier.json');
const shared = require('./shared');

const publicPath = '/';

/**
 * This webpack configuration is used by the Appsemble app.
 */
module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';

  const config = shared('app', argv);
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: join(config.entry[0], 'error.html'),
      filename: 'error.html',
      minify,
      chunks: [],
    }),
    new ServiceWorkerWebpackPlugin({
      entry: require.resolve('@appsemble/service-worker/src/index.ts'),
      filename: 'service-worker.js',
      minimize: production,
      publicPath,
      transformOptions: ({ assets }) => assets,
    }),
  );
  return config;
};
