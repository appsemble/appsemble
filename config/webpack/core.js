const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');
const merge = require('webpack-merge');

const shared = require('./shared');

const publicPath = '/';

module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const appEntry = path.resolve(__dirname, '../../app');
  const editorEntry = path.resolve(__dirname, '../../editor');

  return merge.smart(shared(env, argv), {
    name: 'Appsemble',
    entry: {
      app: [appEntry],
      editor: [editorEntry],
    },
    output: {
      filename: production ? '[name]/[hash].js' : '[name]/[name].js',
      publicPath,
    },
    plugins: [
      new ServiceWorkerWebpackPlugin({
        entry: path.join(appEntry, 'service-worker'),
        filename: 'service-worker.js',
        minimize: production,
        publicPath,
        transformOptions: ({ assets }) => assets.filter(asset => asset.startsWith('/app/')),
      }),
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['app/**/*.*'],
        globOptions: {
          ignore: ['**/package.json', '**/*.test.{js,jsx}', '**/service-worker/**'],
        },
      }),
      new MiniCssExtractPlugin({
        filename: production ? '[name]/[hash].css' : '[name]/[name].css',
      }),
      production && new CleanWebpackPlugin(['dist']),
    ].filter(Boolean),
  });
};
