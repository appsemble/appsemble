const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');


module.exports = (env, { mode }) => ({
  entry: path.join(__dirname, env, 'src'),
  output: {
    path: path.join(__dirname, env, 'dist'),
    filename: '[hash].js',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@material-ui/core': '@material-ui/core/es',
      '@material-ui/icons': '@material-ui/icons/es',
      // These are required by leaflet CSS in a way which doesn’t work with webpack by default.
      './images/layers.png$': path.resolve(__dirname, '../node_modules/leaflet/dist/images/layers.png'),
      './images/layers-2x.png$': path.resolve(__dirname, '../node_modules/leaflet/dist/images/layers-2x.png'),
      './images/marker-icon.png$': path.resolve(__dirname, '../node_modules/leaflet/dist/images/marker-icon.png'),
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
                  localIdentName: mode === 'production' ? '[hash:base64:5]' : '[path][name]_[local]',
                },
              },
              'postcss-loader',
            ],
          },
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
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[hash].css' }),
    mode === 'production' && new CleanWebpackPlugin([path.join(__dirname, env, 'dist')]),
    new ManifestPlugin({
      // eslint-disable-next-line global-require, import/no-dynamic-require
      seed: require(path.join(__dirname, env, 'block.json')),
      generate(seed, files) {
        return {
          ...seed,
          files: files.map(file => file.path),
        };
      },
    }),
  ],
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
