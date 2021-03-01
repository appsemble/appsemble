import { Compiler, Configuration, ICompiler } from 'webpack';

import { KoaMiddleware } from '../types';

export async function frontend(webpackConfigs: Configuration[]): Promise<KoaMiddleware> {
  // eslint-disable-next-line node/no-unpublished-import
  const { default: koaWebpack } = await import('koa-webpack');
  const { default: webpack } = await import('webpack');
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore Because the webpack core config isn’t built when building the server, an error is
  // expected here at build time, but while type checking.
  const { createAppConfig, createStudioConfig } = await import('@appsemble/webpack-core');
  const configApp = createAppConfig({ mode: 'development' });
  const configStudio = createStudioConfig({ mode: 'development' });
  const compiler = (webpack([configApp, configStudio, ...webpackConfigs]) as ICompiler) as Compiler;
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
