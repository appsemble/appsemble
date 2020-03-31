import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { UnusedFilesWebpackPlugin } from 'unused-files-webpack-plugin';
import merge from 'webpack-merge';

import shared from './shared';

/**
 * This webpack configuration is used by Appsemble blocks.
 */
export default ({ dir, name }, argv) => {
  const [, blockName] = name.split('/');
  const srcPath = path.join(dir, 'src');
  const production = argv.mode === 'production';

  return merge.smart(shared(blockName, argv), {
    name,
    entry: [srcPath],
    output: {
      filename: `${blockName}.js`,
    },
    module: {
      rules: [
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
  });
};
