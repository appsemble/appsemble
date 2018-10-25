import path from 'path';

import klawSync from 'klaw-sync';
import serve from 'koa-static';

export default async function configureStatic(app) {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, '../../dist');
    app.use(serve(distDir, { immutable: true, maxage: 365 * 24 * 60 * 60 * 1e3 }));
    const assets = klawSync(distDir, { nodir: true })
      .map(file => path.relative(distDir, file.path))
      .reduce((acc, file) => {
        const chunk = file.split('/')[0];
        acc[chunk] = acc[chunk] || [];
        acc[chunk].push(file);
        return acc;
      }, {});
    app.use(async (ctx, next) => {
      ctx.state.getAssets = () => assets;
      await next();
    });
  } else {
    const { default: koaWebpack } = await import('koa-webpack');
    const { default: webpackConfig } = await import('../../webpack.config');
    const config = await webpackConfig(null, { mode: 'development' });
    const middleware = await koaWebpack({
      config,
      devMiddleware: {
        logLevel: 'warn',
        serverSideRender: true,
      },
    });
    app.use(middleware);
    app.use(async (ctx, next) => {
      ctx.state.getAssets = () => ctx.state.webpackStats.toJson().assetsByChunkName;
      await next();
    });
  }
}
