const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * This webpack configuration is shared by all webpack builds.
 *
 * This includes the core part and blocks.
 */
module.exports = (env, { mode }) => {
  const production = mode === 'production';

  return {
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        // These are required by leaflet CSS in a way which doesn’t work with webpack by default.
        './images/layers.png$': 'leaflet/dist/images/layers.png',
        './images/layers-2x.png$': 'leaflet/dist/images/layers-2x.png',
        './images/marker-icon.png$': 'leaflet/dist/images/marker-icon.png',
      },
    },
    devtool: 'source-map',
    mode,
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          loader: 'babel-loader',
          exclude: [/node_modules/],
          options: {
            envName: mode,
          },
        },
        {
          test: /\.css$/,
          oneOf: [
            {
              test: /(node_modules|amsterdam\.css)/,
              use: [
                MiniCssExtractPlugin.loader,
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 1,
                    sourceMap: true,
                  },
                },
                'postcss-loader',
              ],
            },
            {
              use: [
                MiniCssExtractPlugin.loader,
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 1,
                    sourceMap: true,
                    modules: {
                      localIdentName: production ? '[hash:base64:5]' : '[path][name]_[local]',
                    },
                  },
                },
                'postcss-loader',
              ],
            },
          ],
        },
      ],
    },
    plugins: [new CaseSensitivePathsPlugin()],
    optimization: {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
        }),
        new OptimizeCSSAssetsPlugin(),
      ],
    },
  };
};
