const { join } = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const UnusedWebpackPlugin = require('unused-webpack-plugin');

const shared = require('./shared');

/**
 * This webpack configuration is used by Appsemble blocks.
 */
module.exports = ({ dir, name }, argv) => {
  const [, blockName] = name.split('/');
  const srcPath = join(dir, 'src');
  const production = argv.mode === 'production';

  const sharedConfig = shared(blockName, argv);

  return {
    ...sharedConfig,
    name,
    entry: [srcPath],
    output: {
      filename: `${blockName}.js`,
    },
    resolve: {
      ...sharedConfig.resolve,
      plugins: [new TsconfigPathsPlugin({ configFile: join(dir, 'tsconfig.json') })],
    },
    module: {
      rules: [
        ...sharedConfig.module.rules,
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: join(dir, 'tsconfig.json'),
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
      new UnusedWebpackPlugin({
        directories: [srcPath],
        exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/types.ts'],
        failOnUnused: production,
      }),
    ],
  };
};
