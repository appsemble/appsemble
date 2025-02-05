import { createRequire } from 'node:module';
import { join } from 'node:path';

import { type ProjectBuildConfig } from '@appsemble/types';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { type Configuration } from 'webpack';

const require = createRequire(import.meta.url);

interface CliConfigOptions {
  mode: 'development' | 'production';
}

const loaders = {
  css: require.resolve('css-loader'),
  postcss: require.resolve('postcss-loader'),
  svgo: require.resolve('svgo-loader'),
  ts: require.resolve('ts-loader'),
};

export default function createWebpackConfig(
  { dir, name }: ProjectBuildConfig,
  { mode }: CliConfigOptions,
): Configuration {
  const [, blockName] = name.split('/');
  const srcPath = join(dir, 'src');
  const production = mode === 'production';
  const configFile = join(dir, 'tsconfig.json');

  return {
    name,
    entry: [srcPath],
    output: {
      filename: `${blockName}.js`,
    },
    stats: {
      errorDetails: true,
    },
    resolve: {
      conditionNames: ['ts-source', '...'],
      extensions: ['.js', '.ts', '.tsx', '.json'],
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx'],
        '.cjs': ['.cjs', '.cts'],
        '.mjs': ['.mjs', '.mts'],
      },
      alias: {
        // These are required by leaflet CSS in a way which doesn’t work with webpack by default.
        './images/layers.png$': 'leaflet/dist/images/layers.png',
        './images/layers-2x.png$': 'leaflet/dist/images/layers-2x.png',
        './images/marker-icon.png$': 'leaflet/dist/images/marker-icon.png',
      },
      fallback: {
        path: false,
      },
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
            compilerOptions: { sourceMap: true },
          },
        },
        {
          test: /\.(gif|jpe?g|png|svg|woff2?)$/,
          type: 'asset/resource',
        },
        {
          test: /\.svg$/,
          loader: loaders.svgo,
        },
      ],
    },
    plugins: [
      new CaseSensitivePathsPlugin(),
      new MiniCssExtractPlugin({ filename: `${blockName}.css` }),
    ],
    optimization: {
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  };
}
