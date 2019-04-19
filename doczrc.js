// eslint-disable-next-line import/no-extraneous-dependencies
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';

const PUBLIC = '/public';

const modifyBundlerConfig = config => {
  config.plugins.push(
    new FaviconsWebpackPlugin({
      logo: `${PUBLIC}/favicon.svg`,
      inject: true,
    }),
  );

  return config;
};

module.exports = {
  base: process.env.CI_ENVIRONMENT_URL
    ? new URL(process.env.CI_ENVIRONMENT_URL).pathname.replace(/index\.html$/, '')
    : '/',
  src: './docs',
  title: 'Appsemble',
  menu: ['Getting Started', 'Architecture', 'Blocks', 'Development', 'Deployment'],
  public: PUBLIC,
  modifyBundlerConfig,
};
