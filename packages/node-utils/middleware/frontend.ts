import { isIP } from 'node:net';

import { createAppConfig, createStudioConfig } from '@appsemble/webpack-core';
import expressToKoa from 'express-to-koa';
import { type Context, type Middleware } from 'koa';
import compose from 'koa-compose';
import webpack, { type Configuration } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

/**
 * Bypass the dev server for API requests to speed them up.
 */
const skipRoute = /^\/(api|oauth2\/token)/;

export function frontend(
  webpackConfigs: Configuration[],
  argv: Record<string, any>,
  serveStudio = false,
): Middleware {
  const configApp = createAppConfig({ mode: 'development' });
  const configStudio = createStudioConfig({ mode: 'development' });

  const configs = [configApp, ...(serveStudio ? [configStudio] : []), ...webpackConfigs];
  const compiler = webpack(configs as any);

  const devMiddleware = webpackDevMiddleware(compiler as any, { serverSideRender: true });

  // @ts-expect-error outputFileSystem exists despite what the types say.
  const fs: import('memfs').IFs = devMiddleware.context.outputFileSystem;
  const koaDevMiddleware = expressToKoa(devMiddleware);

  return compose<Context>([
    (ctx, next) => {
      ctx.fs = fs;
      return next();
    },
    (ctx, next) => {
      const { hostname } = ctx;

      if (!skipRoute.test(ctx.path)) {
        return koaDevMiddleware(ctx, next);
      }
      if (new URL(argv.host).hostname === hostname || isIP(hostname)) {
        return next();
      }
      return koaDevMiddleware(ctx, next);
    },
  ]);
}
