import { isIP } from 'node:net';

import expressToKoa from 'express-to-koa';
import { type Context, type Middleware } from 'koa';
import compose from 'koa-compose';
import webpack, { type Configuration } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

/**
 * Bypass the dev server for API requests to speed them up.
 */
const skipRoute = /^\/(api|oauth2\/token)/;

export async function frontend(
  webpackConfigs: Configuration[],
  argv: Record<string, any>,
  serveStudio = false,
): Promise<Middleware> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Because the webpack core config isn’t built when building the server, an error is
  // expected here at build time, but while type checking.
  const { createAppConfig, createStudioConfig } = await import('@appsemble/webpack-core');

  const configApp = createAppConfig({ mode: 'development' });
  const configStudio = createStudioConfig({ mode: 'development' });

  const configs = [configApp, ...(serveStudio ? [configStudio] : []), ...webpackConfigs];
  const compiler = webpack(configs);

  const devMiddleware = webpackDevMiddleware(compiler, { serverSideRender: true });

  // @ts-expect-error outputFileSystem exists despite what the types say.
  const fs: import('memfs').IFs = devMiddleware.context.outputFileSystem;
  const koaDevMiddleware = expressToKoa(devMiddleware);

  return compose<Context>([
    (ctx, next) => {
      ctx.fs = fs;
      return next();
    },
    (ctx, next) => {
      const { app, hostname } = ctx;

      if (!skipRoute.test(ctx.path)) {
        return koaDevMiddleware(ctx, next);
      }

      if (
        (new URL(argv.host).hostname === hostname && app.env !== 'development') ||
        isIP(hostname)
      ) {
        return next();
      }

      return koaDevMiddleware(ctx, next);
    },
  ]);
}
