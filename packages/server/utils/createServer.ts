import {
  bodyParser,
  boomMiddleware,
  conditional,
  frontend,
  type GetApiKeyUser,
  type GetHttpUser,
  type GetOAuth2User,
  loggerMiddleware,
  parameters,
  security,
  type SecurityOptions,
  serializer,
  type UtilsUser,
} from '@appsemble/node-utils';
import { api } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import cors from '@koa/cors';
import Koa, { type Middleware } from 'koa';
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
import { authentication } from './authentication.js';
import { Mailer } from './email/Mailer.js';
import * as controllers from '../controllers/index.js';
import { appMapper } from '../middleware/appMapper.js';
import pkg from '../package.json' assert { type: 'json' };
import { appRouter, studioRouter } from '../routes/index.js';

export interface AuthenticationCheckers {
  basic: GetHttpUser<UtilsUser>;
  app: GetOAuth2User<UtilsUser>;
  cli: GetOAuth2User<UtilsUser>;
  scim: GetApiKeyUser<UtilsUser>;
  studio: GetApiKeyUser<UtilsUser>;
}

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
  app.use(boomMiddleware());
  app.use(range);

  Object.assign(app.context, { mailer: new Mailer(argv) });

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  if (!['test', 'production'].includes(process.env.NODE_ENV)) {
    app.use(await frontend(webpackConfigs, argv, true));
  }

  app.use(
    appMapper(
      compose([
        conditional((ctx) => ctx.path.startsWith('/api') || ctx.path === '/oauth2/token', cors()),
        koas(api(pkg.version, argv), [
          specHandler(),
          swaggerUI({ url: '/api-explorer' }),
          security(authentication() as SecurityOptions),
          parameters(),
          bodyParser(),
          serializer(),
          statusCode(),
          operations({ controllers }),
        ]),
        ({ path }, next) => {
          if (path.startsWith('/api/')) {
            throw notFound('URL not found');
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
