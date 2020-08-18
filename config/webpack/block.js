const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');

const shared = require('./shared');

/**
 * This webpack configuration is used by Appsemble blocks.
 */
module.exports = ({ dir, name }, argv) => {
  const [, blockName] = name.split('/');
  const srcPath = path.join(dir, 'src');
  const production = argv.mode === 'production';

  const sharedConfig = shared(blockName, argv);

  return {
    ...sharedConfig,
    name,
    entry: [srcPath],
    output: {
      filename: `${blockName}.js`,
    },
    module: {
      rules: [
        ...sharedConfig.module.rules,
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.join(dir, 'tsconfig.json'),
          },
        },
        {
          test: /\.(gif|jpe?g|png|svg|woff2?)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            publicPath: argv.publicPath,
          },
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: `${blockName}.css`,
      }),
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['**/*.*'],
        globOptions: {
          cwd: srcPath,
          ignore: ['**/package.json', '**/*.test.{js,ts,tsx}'],
        },
      }),
      production && new CleanWebpackPlugin(),
    ].filter(Boolean),
  };
};
