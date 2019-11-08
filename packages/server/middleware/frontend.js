import fs from 'fs-extra';
import compose from 'koa-compose';
import serve from 'koa-static';
import mustache from 'mustache';
import path from 'path';

export default async function frontend(webpackConfigs) {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, '../../../dist');
    return compose([
      serve(distDir, { immutable: true, maxage: 365 * 24 * 60 * 60 * 1e3 }),
      async (ctx, next) => {
        ctx.state.render = async (filename, data) => {
          const template = await fs.readFile(path.join(distDir, filename), 'utf8');
          return mustache.render(template, data);
        };
        await next();
      },
    ]);
  }
  const { default: koaWebpack } = await import('koa-webpack');
  const { default: webpack } = await import('webpack');
  const { default: webpackConfigApp } = await import('../../../config/webpack/app');
  const { default: webpackConfigStudio } = await import('../../../config/webpack/studio');
  const configApp = webpackConfigApp(null, { mode: 'development' });
  const configStudio = webpackConfigStudio(null, { mode: 'development' });
  configApp.output.path = configApp.output.publicPath;
  configStudio.output.path = configStudio.output.publicPath;
  const compiler = webpack([configApp, configStudio, ...webpackConfigs]);
  const middleware = await koaWebpack({
    compiler,
    config: null,
    devMiddleware: {
      logLevel: 'warn',
      publicPath: '/',
      serverSideRender: true,
    },
  });
  return compose([
    middleware,
    async (ctx, next) => {
      ctx.state.render = async (filename, data) => {
        // ctx.state.fs is injected by koa-webpack.
        const template = ctx.state.fs.readFileSync(`/${filename}`, 'utf8');
        return mustache.render(template, data);
      };
      await next();
    },
  ]);
}
