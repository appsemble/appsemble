import {
  bodyParser,
  boomMiddleware,
  conditional,
  frontend,
  loggerMiddleware,
  parameters,
  serializer,
} from '@appsemble/node-utils';
import { api } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import cors from '@koa/cors';
import Koa from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import range from 'koa-range';
import { koas } from 'koas-core';
import { operations } from 'koas-operations';
import { statusCode } from 'koas-status-code';
import { type Configuration } from 'webpack';

import pkg from '../package.json' assert { type: 'json' };
import * as controllers from '../server/controllers/index.js';
import { appRouter } from '../server/routes/appRouter/index.js';

interface CreateServerOptions {
  /**
   * Server arguments
   */
  argv: Record<string, any>;

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
  argv,
  context,
  webpackConfigs,
}: CreateServerOptions): Promise<Koa> {
  const app = new Koa();

  app.use(loggerMiddleware());
  app.use(boomMiddleware());
  app.use(range);

  Object.assign(app.context, context);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  if (!['test', 'production'].includes(process.env.NODE_ENV)) {
    app.use(await frontend(webpackConfigs, argv));
  }

  app.use(appRouter);

  return app;
}

export function createApiServer({ argv, context }: CreateServerOptions): Koa {
  const app = new Koa();

  app.use(loggerMiddleware());
  app.use(boomMiddleware());
  app.use(range);

  Object.assign(app.context, context);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(
    compose([
      conditional((ctx) => ctx.path.startsWith('/api') || ctx.path === '/oauth2/token', cors()),
      koas(api(pkg.version, argv), [
        parameters(),
        bodyParser(),
        serializer(),
        statusCode(),
        operations({ controllers, throwOnNotImplemented: false }),
      ]),
      ({ path }, next) => {
        if (path.startsWith('/api/')) {
          throw notFound('URL not found');
        }
        return next();
      },
    ]),
  );

  return app;
}
