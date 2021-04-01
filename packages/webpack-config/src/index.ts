import { join } from 'path';

import { BlockConfig } from '@appsemble/types';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { CliConfigOptions, Configuration } from 'webpack';

const loaders = {
  css: require.resolve('css-loader'),
  file: require.resolve('file-loader'),
  postcss: require.resolve('postcss-loader'),
  svgo: require.resolve('svgo-loader'),
  ts: require.resolve('ts-loader'),
};

export = function createWebpackConfig(
  { dir, name, version }: BlockConfig,
  { mode }: CliConfigOptions,
): Configuration {
  const [, blockName] = name.split('/');
  const publicPath = `/api/blocks/${name}/versions/${version}`;
  const srcPath = join(dir, 'src');
  const production = mode === 'production';
  const configFile = join(dir, 'tsconfig.json');

  return {
    name,
    entry: [srcPath],
    output: {
      filename: `${blockName}.js`,
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json'],
      alias: {
        // These are required by leaflet CSS in a way which doesn’t work with webpack by default.
        './images/layers.png$': 'leaflet/dist/images/layers.png',
        './images/layers-2x.png$': 'leaflet/dist/images/layers-2x.png',
        './images/marker-icon.png$': 'leaflet/dist/images/marker-icon.png',
      },
      plugins: [new TsconfigPathsPlugin({ configFile })],
    },
    devtool: 'source-map',
    mode,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: loaders.css,
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  localIdentName: production ? '[hash:base64:5]' : '[path][name]_[local]',
                },
              },
            },
            loaders.postcss,
          ],
        },
        {
          test: /\.tsx?$/,
          loader: loaders.ts,
          options: {
            transpileOnly: true,
            configFile,
            compilerOptions: { module: 'esnext', sourceMap: true },
          },
        },
        {
          test: /\.(gif|jpe?g|png|svg|woff2?)$/,
          loader: loaders.file,
          options: {
            name: '[name].[ext]',
            publicPath,
          },
        },
        {
          test: /\.svg$/,
          loader: loaders.svgo,
        },
      ],
    },
    plugins: [
      new CaseSensitivePathsPlugin(),
      // @ts-expect-error This uses Webpack 5 types, but it’s compatible with both Webpack 4 and 5.
      new MiniCssExtractPlugin({ filename: `${blockName}.css` }),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({ cache: true, parallel: true, sourceMap: true }),
        new OptimizeCSSAssetsPlugin(),
      ],
    },
  };
};
