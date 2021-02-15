const { join, resolve } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const UnusedWebpackPlugin = require('unused-webpack-plugin');

const core = require('./core');
const minify = require('./html-minifier.json');

const publicPath = '/';

/**
 * This webpack configuration is used by the Appsemble app.
 */
module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const appEntry = resolve(__dirname, '../../packages/app/src');

  const coreConfig = core('app', argv);

  return {
    ...coreConfig,
    name: 'Appsemble App',
    entry: [appEntry],
    output: {
      filename: production ? '_/[contentHash].js' : '_/app/[name].js',
      publicPath,
    },
    plugins: [
      ...coreConfig.plugins,
      new HtmlWebpackPlugin({
        template: join(appEntry, 'index.html'),
        filename: 'app.html',
        minify,
      }),
      new HtmlWebpackPlugin({
        template: join(appEntry, 'error.html'),
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
      new UnusedWebpackPlugin({
        directories: [appEntry],
        exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/types.ts'],
        failOnUnused: production,
      }),
      new MiniCssExtractPlugin({
        filename: production ? '_/[contentHash].css' : '_/app/[name].css',
      }),
    ],
  };
};
