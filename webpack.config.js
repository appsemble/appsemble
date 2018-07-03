const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const fs = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');


module.exports = async (env, { mode }) => {
  const production = mode === 'production';
  const development = !production;
  const blocksDir = path.join(__dirname, 'blocks');
  const blocks = await fs.readdir(blocksDir);

  return {
    entry: blocks.reduce((acc, block) => ({
      ...acc,
      [block]: path.join(blocksDir, block, 'src'),
    }), {
      app: path.join(__dirname, 'src'),
    }),
    output: {
      filename: '[name]/[hash].js',
    },
    resolve: {
      extensions: ['.mjs', '.js', '.jsx'],
      alias: {
        '@material-ui/core': '@material-ui/core/es',
        '@material-ui/icons': '@material-ui/icons/es',
        // These are required by leaflet CSS in a way which doesn’t work with webpack by default.
        './images/layers.png$': 'leaflet/dist/images/layers.png',
        './images/layers-2x.png$': 'leaflet/dist/images/layers-2x.png',
        './images/marker-icon.png$': 'leaflet/dist/images/marker-icon.png',
      },
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.jsx$/,
          loader: 'babel-loader',
          options: {
            envName: mode,
          },
        },
        {
          test: /\.css$/,
          oneOf: [
            {
              test: /node_modules/,
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
          test: /\.woff2?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                publicPath: '/',
              },
            },
          ],
        },
        {
          test: /\.(gif|jpe?g|png|svg)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                publicPath: '/',
              },
            },
            {
              loader: 'image-webpack-loader',
              options: {
                disable: development,
              },
            },
          ],
        },
        {
          test: /\.yaml$/,
          include: path.join(__dirname, 'apps'),
          use: [
            'file-loader',
            'yaml-loader',
          ],
        },
      ],
    },
    devServer: {
      contentBase: __dirname,
      disableHostCheck: true,
      historyApiFallback: true,
      host: '0.0.0.0',
      hot: true,
      port: 1337,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src/index.html'),
        chunks: ['app'],
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeOptionalTags: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
        },
      }),
      new MiniCssExtractPlugin({ filename: '[name]/[hash].css' }),
      production && new CleanWebpackPlugin(['dist']),
      development && new webpack.HotModuleReplacementPlugin(),
      ...blocks.map(block => new ManifestPlugin({
        fileName: `${block}/manifest.json`,
        // eslint-disable-next-line global-require, import/no-dynamic-require
        seed: require(path.join(blocksDir, block, 'package.json')),
        filter: file => file.path.startsWith(block),
        map: file => file.path,
        generate: (pkg, files) => ({
          id: pkg.name.split('/').pop(),
          ...pkg.appsemble,
          files,
        }),
      })),
    ].filter(Boolean),
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
        }),
        new OptimizeCSSAssetsPlugin(),
      ],
    },
  };
};
