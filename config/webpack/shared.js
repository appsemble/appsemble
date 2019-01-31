const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, { mode, publicPath }) => {
  const production = mode === 'production';

  return {
    resolve: {
      extensions: ['.js', '.jsx'],
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
          test: /\.jsx?$/,
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
                    modules: true,
                    localIdentName: production ? '[hash:base64:5]' : '[path][name]_[local]',
                  },
                },
                'postcss-loader',
              ],
            },
          ],
        },
        {
          test: /\.(gif|jpe?g|png|woff2?)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: production ? '_/[hash].[ext]' : '_/[name].[ext]',
                publicPath,
              },
            },
          ],
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: production ? '_/[hash].[ext]' : '_/[name].[ext]',
                publicPath,
              },
            },
            'svgo-loader',
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
