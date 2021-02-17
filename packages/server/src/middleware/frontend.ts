import { resolve } from 'path';

import serve from 'koa-static';
import { Compiler, Configuration, ICompiler } from 'webpack';

import { KoaMiddleware } from '../types';

export async function frontend(webpackConfigs: Configuration[]): Promise<KoaMiddleware> {
  if (process.env.NODE_ENV === 'production') {
    const distDir = resolve(__dirname, '../../../../dist');
    return serve(distDir, { immutable: true, maxage: 365 * 24 * 60 * 60 * 1e3 });
  }
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
  configApp.output.path = configApp.output.publicPath;
  configStudio.output.path = configStudio.output.publicPath;
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
