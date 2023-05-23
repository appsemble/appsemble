import { parse } from 'node:querystring';

import {
  appMapper,
  boomMiddleware,
  conditional,
  frontend,
  loggerMiddleware,
  type UtilsUser,
} from '@appsemble/node-utils';
import { api, convertToCsv } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import cors from '@koa/cors';
import { parse as parseCSV } from 'csv-parse';
import Koa, {
  type DefaultContext,
  type DefaultState,
  type Middleware,
  type ParameterizedContext,
} from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import range from 'koa-range';
import { bodyParser, bufferParser, type Parser } from 'koas-body-parser';
import { koas } from 'koas-core';
import { operations } from 'koas-operations';
import { parameters } from 'koas-parameters';
import {
  type GetApiKeyUser,
  type GetHttpUser,
  type GetOAuth2User,
  security,
  type SecurityOptions,
} from 'koas-security';
import { serializer } from 'koas-serializer';
import { specHandler } from 'koas-spec-handler';
import { statusCode } from 'koas-status-code';
import { swaggerUI } from 'koas-swagger-ui';
import { type Configuration } from 'webpack';

import pkg from './package.json' assert { type: 'json' };

const xWwwFormUrlencodedParser: Parser<unknown> = async (body, mediaTypeObject, options, ctx) => {
  const buffer = await bufferParser(body, mediaTypeObject, options, ctx);
  return parse(String(buffer));
};

const csvParser: Parser<unknown[]> = (body) =>
  new Promise((resolve, reject) => {
    body.pipe(
      parseCSV({ bom: true, columns: true }, (error, records) => {
        if (error) {
          reject(error);
        } else {
          resolve(records);
        }
      }),
    );
  });

export interface AuthenticationCheckers {
  basic: GetHttpUser<UtilsUser>;
  app: GetOAuth2User<UtilsUser>;
  cli: GetOAuth2User<UtilsUser>;
  studio: GetApiKeyUser<UtilsUser>;
}

interface CreateServerOptions {
  /**
   * Server arguments
   */
  argv: Record<string, any>;

  /**
   * A tiny router implementation to handle GET requests for the app
   */
  appRouter: Middleware<ParameterizedContext<DefaultState, DefaultContext>>;

  /**
   * A tiny router implementation to handle GET requests for the studio
   */
  studioRouter?: Middleware<ParameterizedContext<DefaultState, DefaultContext>>;

  controllers: Record<string, Middleware<DefaultState, DefaultContext>>;

  /**
   * Additional context to append to the server.
   */
  context?: Record<string, any>;

  /**
   * Authentication for the server.
   */
  authentication?: AuthenticationCheckers;

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

  /**
   * Specifies whether to serve the swagger ui for the server
   */
  swagger?: boolean;
}

export function createServer({
  appRouter,
  argv,
  authentication,
  context,
  controllers,
  middleware,
  studioRouter,
  swagger,
  webpackConfigs,
}: CreateServerOptions): Koa {
  const app = new Koa();

  if (argv.secret) {
    app.keys = [argv.secret];
  }

  if (argv.proxy) {
    app.proxy = argv.proxy;
  }

  if (middleware) {
    app.use(middleware);
  }

  app.use(loggerMiddleware());
  app.use(boomMiddleware());
  app.use(range);

  Object.assign(app.context, context);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  if (!['test', 'production'].includes(process.env.NODE_ENV)) {
    app.use(frontend(webpackConfigs, argv, Boolean(studioRouter)));
  }

  app.use(
    appMapper(
      compose([
        conditional((ctx) => ctx.path.startsWith('/api') || ctx.path === '/oauth2/token', cors()),
        koas(api(pkg.version, argv), [
          specHandler(),
          ...(swagger ? [swaggerUI({ url: '/api-explorer' })] : []),
          ...(authentication ? [security(authentication as SecurityOptions)] : []),
          parameters(),
          bodyParser({
            parsers: {
              'application/x-www-form-urlencoded': xWwwFormUrlencodedParser,
              'text/csv': csvParser,
              '*/*': bufferParser,
            },
          }),
          serializer({
            serializers: {
              'application/xml': (body: string) => body,
              'text/csv': convertToCsv,
            },
          }),
          statusCode(),
          operations({ controllers, throwOnNotImplemented: false }),
        ]),
        ({ path }, next) => {
          if (path.startsWith('/api/')) {
            throw notFound('URL not found');
          }
          return next();
        },
        ...(studioRouter ? [studioRouter] : []),
      ]),
      appRouter,
      argv,
    ),
  );

  return app;
}
