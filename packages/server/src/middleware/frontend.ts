import { Compiler, Configuration, ICompiler } from 'webpack';

import { KoaMiddleware } from '../types';

export async function frontend(webpackConfigs: Configuration[]): Promise<KoaMiddleware> {
  // eslint-disable-next-line node/no-unpublished-import
  const { default: koaWebpack } = await import('koa-webpack');
  const { default: webpack } = await import('webpack');
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
