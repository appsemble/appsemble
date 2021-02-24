import { Compiler, Configuration, ICompiler } from 'webpack';

import { KoaMiddleware } from '../types';

export async function frontend(webpackConfigs: Configuration[]): Promise<KoaMiddleware> {
  // eslint-disable-next-line node/no-unpublished-import
  const { default: koaWebpack } = await import('koa-webpack');
  const { default: webpack } = await import('webpack');
  // @ts-expect-error This includes an untyped JavaScript file.
  // eslint-disable-next-line node/no-unpublished-import
  const { default: webpackConfigApp } = await import('../../../../config/webpack/app');
  // @ts-expect-error This includes an untyped JavaScript file.
  // eslint-disable-next-line node/no-unpublished-import
  const { default: webpackConfigStudio } = await import('../../../../config/webpack/studio');
  const configApp = webpackConfigApp(null, { mode: 'development' });
  const configStudio = webpackConfigStudio(null, { mode: 'development' });
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
