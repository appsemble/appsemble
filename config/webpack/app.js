const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');

const core = require('./core');
const minify = require('./html-minifier.json');

const publicPath = '/';

/**
 * This webpack configuration is used by the Appsemble app.
 */
module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const appEntry = path.resolve(__dirname, '../../packages/app/src');

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
        template: path.join(appEntry, 'index.html'),
        filename: 'app.html',
        minify,
      }),
      new HtmlWebpackPlugin({
        template: path.join(appEntry, 'error.html'),
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
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['app/**/*.*'],
        globOptions: {
          ignore: ['**/node_modules/**', '**/package.json', '**/*.test.{js,ts,tsx}'],
        },
      }),
      new MiniCssExtractPlugin({
        filename: production ? '_/[contentHash].css' : '_/app/[name].css',
      }),
    ],
  };
};
