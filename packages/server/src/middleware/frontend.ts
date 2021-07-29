import { Middleware } from 'koa';
import { Configuration } from 'webpack';

export async function frontend(webpackConfigs: Configuration[]): Promise<Middleware> {
  // eslint-disable-next-line import/no-extraneous-dependencies,node/no-unpublished-import
  const { default: koaWebpack } = await import('koa-webpack');
  const { default: webpack } = await import('webpack');
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore Because the webpack core config isn’t built when building the server, an error is
  // expected here at build time, but while type checking.
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { createAppConfig, createStudioConfig } = await import('@appsemble/webpack-core');
  const configApp = createAppConfig({ mode: 'development' });
  const configStudio = createStudioConfig({ mode: 'development' });
  const compiler = webpack([configApp, configStudio, ...webpackConfigs]);
  return koaWebpack({
    compiler,
    config: null,
    devMiddleware: {
      logLevel: 'warn',
      publicPath: '/',
      serverSideRender: true,
    },
  });
}
