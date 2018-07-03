const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');


module.exports = (env, { mode }) => ({
  output: {
    filename: '[hash].js',
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx'],
    alias: {
      '@material-ui/core': '@material-ui/core/es',
      '@material-ui/icons': '@material-ui/icons/es',
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
        use: [
          mode === 'production' ? MiniCssExtractPlugin.loader : {
            loader: 'style-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
              modules: true,
              localIdentName: mode === 'production' ? '[hash:base64:5]' : '[path][name]_[local]',
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.woff2?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(gif|jpe?g|png|svg)$/,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              disable: mode === 'development',
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
      template: path.resolve(__dirname, 'src/index.html'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
      },
    }),
    new MiniCssExtractPlugin({ filename: '[hash].css' }),
    mode === 'production' && new CleanWebpackPlugin(['dist']),
    mode === 'development' && new webpack.HotModuleReplacementPlugin(),
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
});
