const merge = require('webpack-merge');
const path = require('path');

const shared = require('./shared');

/**
 * This webpack configuration is used by the Appsemble core parts.
 *
 * This includes the app and studio, but not blocks.
 */
module.exports = (env, argv) => {
  const { mode, publicPath } = argv;
  const production = mode === 'production';

  return merge.smart(shared(env, argv), {
    module: {
      rules: [
        {
          test: /\/messages\.tsx?$/,
          loader: 'babel-loader',
          options: {
            plugins: ['babel-plugin-react-intl-auto'],
          },
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.join(
              path.resolve(__dirname, '../..'),
              'packages',
              env,
              'tsconfig.json',
            ),
          },
        },
        {
          test: /\.(gif|jpe?g|png|svg|ttf|woff2?)$/,
          loader: 'file-loader',
          options: {
            name: production ? '_/[contentHash].[ext]' : '_/[name].[ext]',
            publicPath,
          },
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
        },
      ],
    },
  });
};
