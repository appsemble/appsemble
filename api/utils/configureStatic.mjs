export default async function configureStatic(app) {
  if (process.env.NODE_ENV !== 'production') {
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
  }
}
