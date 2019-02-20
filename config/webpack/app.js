const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');
const merge = require('webpack-merge');
const { StatsWriterPlugin } = require('webpack-stats-plugin');

const core = require('./core');

const publicPath = '/';

/**
 * This webpack configuration is used by the Appsemble app.
 */
module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const appEntry = path.resolve(__dirname, '../../packages/app');

  return merge.smart(core(env, argv), {
    name: 'Appsemble App',
    entry: [appEntry],
    output: {
      filename: production ? '_/[hash].js' : '_/app/[name].js',
      publicPath,
    },
    plugins: [
      new ServiceWorkerWebpackPlugin({
        entry: path.join(appEntry, 'service-worker'),
        filename: 'service-worker.js',
        minimize: production,
        publicPath,
        transformOptions: ({ assets }) => assets,
      }),
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['app/**/*.*'],
        globOptions: {
          ignore: [
            '**/node_modules/**',
            '**/package.json',
            '**/*.test.{js,jsx}',
            '**/service-worker/**',
          ],
        },
      }),
      new MiniCssExtractPlugin({
        filename: production ? '_/[hash].css' : '_/app/[name].css',
      }),
      production &&
        new StatsWriterPlugin({
          transform({ assetsByChunkName }) {
            return JSON.stringify(assetsByChunkName.main.filter(name => !name.endsWith('.map')));
          },
        }),
    ].filter(Boolean),
  });
};
