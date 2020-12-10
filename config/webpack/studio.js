const { join, resolve } = require('path');

const faPkg = require('@fortawesome/fontawesome-free/package.json');
const bulmaPkg = require('bulma/package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');

const core = require('./core');
const minify = require('./html-minifier.json');

const publicPath = '/';

/**
 * This webpack configuration is used by the Appsemble studio.
 */
module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const studioEntry = resolve(__dirname, '../../packages/studio/src');

  const coreConfig = core('studio', argv);

  return {
    ...coreConfig,
    name: 'Appsemble Studio',
    entry: [studioEntry],
    output: {
      filename: production ? '_/[contentHash].js' : '_/studio/[name].js',
      publicPath,
    },
    plugins: [
      ...coreConfig.plugins,
      new HtmlWebpackPlugin({
        template: join(studioEntry, 'index.html'),
        templateParameters: {
          bulmaURL: `/bulma/${bulmaPkg.version}/bulma.min.css`,
          faURL: `/fa/${faPkg.version}/css/all.min.css`,
        },
        filename: 'studio.html',
        minify,
      }),
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['studio/**/*.*'],
        globOptions: { ignore: ['**/node_modules/**', '**/package.json', '**/*.test.{js,ts,tsx}'] },
      }),
      new MiniCssExtractPlugin({
        filename: production ? '_/[contentHash].css' : '_/studio/[name].css',
      }),
      new MonacoWebpackPlugin({ languages: ['css', 'json', 'yaml'] }),
    ],
  };
};
