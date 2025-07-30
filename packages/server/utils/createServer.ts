import {
  bodyParser,
  conditional,
  errorMiddleware,
  frontend,
  loggerMiddleware,
  parameters,
  security,
  serializer,
  throwKoaError,
  version,
} from '@appsemble/node-utils';
import { api } from '@appsemble/utils';
import cors from '@koa/cors';
import { startSpan } from '@sentry/node';
import Koa, { type Context, type Middleware } from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import range from 'koa-range';
import { koas } from 'koas-core';
import { operations } from 'koas-operations';
import { specHandler } from 'koas-spec-handler';
import { statusCode } from 'koas-status-code';
import { swaggerUI } from 'koas-swagger-ui';
import { type Configuration } from 'webpack';

import { argv } from './argv.js';
import { Mailer } from './email/Mailer.js';
import * as controllers from '../controllers/index.js';
import { appMapper, authentication } from '../middleware/index.js';
import { appRouter, studioRouter } from '../routes/index.js';

interface CreateServerOptions {
  /**
   * Additional middleware to inject before any other middleware.
   *
   * This is used for testing purposes.
   */
  middleware?: Middleware;

  /**
   * Webpack configurations to serve using Webpack dev server middleware.
   */
  webpackConfigs?: Configuration[];
}

export async function createServer({
  middleware,
  webpackConfigs,
}: CreateServerOptions = {}): Promise<Koa> {
  const app = new Koa();
  app.keys = [argv.secret];
  app.proxy = argv.proxy;

  if (middleware) {
    app.use(middleware);
  }

  app.use(loggerMiddleware());
  app.use(errorMiddleware());
  app.use(range);
  app.use((ctx, next) =>
    startSpan(
      {
        name: `${ctx.method} ${ctx.path}`,
        op: 'http.server',
        attributes: {
          'http.method': ctx.method,
          'http.url': ctx.href,
          'http.user_agent': ctx.headers['user-agent'],
          'user.ip': ctx.ip,
        },
      },
      async () => {
        await next();
        return {
          'http.status_code': ctx.status,
          'http.response.size': ctx.length,
        };
      },
    ),
  );

  Object.assign(app.context, { mailer: new Mailer(argv) });

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  if (!['test', 'production'].includes(process.env.NODE_ENV ?? '')) {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    app.use(await frontend(webpackConfigs, argv, true));
  }

  app.use(
    appMapper(
      compose([
        conditional(
          (ctx) =>
            ctx.path.startsWith('/api') ||
            ctx.path === '/auth/oauth2/token' ||
            /\/apps\/\d+\/auth\/oauth2\/token/.test(ctx.path),
          cors(),
        ),
        koas(api(version, argv), [
          specHandler(),
          swaggerUI({ url: '/api-explorer' }),
          security(authentication()),
          parameters(),
          bodyParser(),
          serializer(),
          statusCode(),
          operations({ controllers }),
        ]),
        (ctx, next) => {
          if (ctx.path.startsWith('/api/')) {
            throwKoaError(ctx as Context, 404, 'URL not found');
          }
          return next();
        },
        studioRouter,
      ]),
      appRouter,
    ),
  );

  return app;
}
