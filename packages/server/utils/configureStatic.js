import path from 'path';

import serve from 'koa-static';

export default async function configureStatic(app, webpackConfigs) {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, '../../../dist');
    app.use(serve(distDir, { immutable: true, maxage: 365 * 24 * 60 * 60 * 1e3 }));
    const { default: assets } = await import(path.join(distDir, 'stats.json'));
    app.use(async (ctx, next) => {
      ctx.state.assets = assets;
      await next();
    });
  } else {
    const { default: koaWebpack } = await import('koa-webpack');
    const { default: webpack } = await import('webpack');
    const { default: webpackConfigApp } = await import('../../../config/webpack/app');
    const { default: webpackConfigEditor } = await import('../../../config/webpack/editor');
    const configApp = webpackConfigApp(null, { mode: 'development' });
    const configEditor = webpackConfigEditor(null, { mode: 'development' });
    configApp.output.path = configApp.output.publicPath;
    configEditor.output.path = configEditor.output.publicPath;
    const compiler = webpack([configApp, configEditor, ...webpackConfigs]);
    const middleware = await koaWebpack({
      compiler,
      config: null,
      devMiddleware: {
        logLevel: 'warn',
        publicPath: '/',
        serverSideRender: true,
      },
    });
    app.use(middleware);
    app.use(async (ctx, next) => {
      // The first index is the Webpack stats object for the app compilation. The main chunk is the
      // first chunk.
      ctx.state.assets = ctx.state.webpackStats.stats[0].compilation.chunks[0].files;
      await next();
    });
  }
}
