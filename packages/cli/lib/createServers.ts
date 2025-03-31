import {
  bodyParser,
  conditional,
  errorMiddleware,
  frontend,
  loggerMiddleware,
  parameters,
  serializer,
  throwKoaError,
  version,
} from '@appsemble/node-utils';
import { api } from '@appsemble/utils';
import cors from '@koa/cors';
import Koa, { type ParameterizedContext } from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import range from 'koa-range';
import { koas } from 'koas-core';
import { operations } from 'koas-operations';
import { statusCode } from 'koas-status-code';
import { type Configuration } from 'webpack';

import { argv } from '../server/argv.js';
import * as controllers from '../server/controllers/index.js';
import { appRouter } from '../server/routes/appRouter/index.js';

interface CreateServerOptions {
  /**
   * Additional context to append to the server.
   */
  context?: Record<string, any>;

  /**
   * Webpack configurations to serve using Webpack dev server middleware.
   */
  webpackConfigs?: Configuration[];
}

export async function createStaticServer({
  context,
  webpackConfigs,
}: CreateServerOptions): Promise<Koa> {
  const app = new Koa();

  app.use(loggerMiddleware());
  app.use(errorMiddleware());
  app.use(range);

  Object.assign(app.context, context);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  if (!['test', 'production'].includes(process.env.NODE_ENV ?? '')) {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    app.use(await frontend(webpackConfigs, argv));
  }

  app.use(appRouter);

  return app;
}

export function createApiServer({ context }: CreateServerOptions): Koa {
  const app = new Koa();

  app.use(loggerMiddleware());
  app.use(errorMiddleware());
  app.use(range);

  Object.assign(app.context, context);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(
    compose([
      conditional(
        (ctx) =>
          ctx.path.startsWith('/api') ||
          ctx.path === '/auth/oauth2/token' ||
          /\/apps\/\d+\/auth\/oauth2\/token/.test(ctx.path),
        cors(),
      ),
      koas(api(version, argv), [
        parameters(),
        bodyParser(),
        serializer(),
        statusCode(),
        operations({ controllers, throwOnNotImplemented: false }),
      ]),
      (ctx: ParameterizedContext, next) => {
        if (ctx.path.startsWith('/api/')) {
          throwKoaError(ctx, 404, 'URL not found');
        }
        return next();
      },
    ]),
  );

  return app;
}
