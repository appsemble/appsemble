const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const bulmaPkg = require('bulma/package.json');
// eslint-disable-next-line import/no-extraneous-dependencies
const faPkg = require('@fortawesome/fontawesome-free/package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');
const merge = require('webpack-merge');

const shared = require('./shared');

const publicPath = '/';

module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const editorEntry = path.resolve(__dirname, '../../editor');

  return merge.smart(shared(env, argv), {
    name: 'Appsemble Editor',
    entry: [editorEntry],
    output: {
      filename: production ? '_/[hash].js' : '_/editor/[name].js',
      publicPath,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(editorEntry, 'index.html'),
        templateParameters: {
          bulmaURL: `/bulma/${bulmaPkg.version}/bulma.min.css`,
          faURL: `/fa/${faPkg.version}/css/all.min.css`,
        },
      }),
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['editor/**/*.*'],
        globOptions: { ignore: ['**/node_modules/**', '**/package.json', '**/*.test.{js,jsx}'] },
      }),
      new MiniCssExtractPlugin({
        filename: production ? '_/[hash].css' : '_/editor/[name].css',
      }),
    ],
  });
};
