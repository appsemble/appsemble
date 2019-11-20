const merge = require('webpack-merge');

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
          test: /\.(gif|jpe?g|png|svg|woff2?)$/,
          loader: 'file-loader',
          options: {
            name: production ? '_/[hash].[ext]' : '_/[name].[ext]',
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
