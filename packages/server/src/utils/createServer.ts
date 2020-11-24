import { dirname } from 'path';
import { parse } from 'querystring';

import { loggerMiddleware } from '@appsemble/node-utils';
import { api } from '@appsemble/utils';
import faPkg from '@fortawesome/fontawesome-free/package.json';
import { notFound } from '@hapi/boom';
import cors from '@koa/cors';
import { Readable } from 'form-data';
import Koa from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import mount from 'koa-mount';
import range from 'koa-range';
import serve from 'koa-static';
import { bodyParser, bufferParser, formdataParser } from 'koas-body-parser';
import { koas } from 'koas-core';
import { operations } from 'koas-operations';
import { parameters } from 'koas-parameters';
import { security } from 'koas-security';
import { serializer } from 'koas-serializer';
import { specHandler } from 'koas-spec-handler';
import { statusCode } from 'koas-status-code';
import { swaggerUI } from 'koas-swagger-ui';
import { OpenAPIV3 } from 'openapi-types';
import { Configuration } from 'webpack';

import * as controllers from '../controllers';
import { appMapper } from '../middleware/appMapper';
import { boomMiddleware } from '../middleware/boom';
import { conditional } from '../middleware/conditional';
import { frontend } from '../middleware/frontend';
import { tinyRouter } from '../middleware/tinyRouter';
import { appRouter, studioRouter } from '../routes';
import { bulmaHandler } from '../routes/bulmaHandler';
import { Argv, KoaContext, KoaMiddleware } from '../types';
import { authentication } from './authentication';
import { convertToCsv } from './convertToCsv';
import { Mailer } from './email/Mailer';
import { readPackageJson } from './readPackageJson';

// @ts-expect-error This is needed due to an upstream bug in Koas
bufferParser.skipValidation = true;
// @ts-expect-error This is needed due to an upstream bug in Koas
formdataParser.skipValidation = true;

async function xWwwFormUrlencodedParser(
  body: Readable,
  mediaTypeObject: OpenAPIV3.MediaTypeObject,
  ctx: KoaContext,
): Promise<any> {
  const buffer = await bufferParser(body, mediaTypeObject, ctx);
  const data = parse(String(buffer));
  return data;
}

interface CreateServerOptions {
  /**
   * The CLI arguments processed by yargs.
   */
  argv: Argv;

  /**
   * Additional middleware to inject before any other middleware.
   *
   * This is used for testing purposes.
   */
  middleware?: KoaMiddleware;

  /**
   * Webpack configurations to serve using Webpack dev server middleware.
   */
  webpackConfigs?: Configuration[];
}

export async function createServer({
  argv = {},
  middleware,
  webpackConfigs,
}: CreateServerOptions): Promise<Koa> {
  const app = new Koa();
  app.keys = [argv.secret];
  app.proxy = argv.proxy;
  if (middleware) {
    app.use(middleware);
  }
  app.use(loggerMiddleware());
  app.use(boomMiddleware());
  app.use(range);
  Object.assign(app.context, { argv, mailer: new Mailer(argv) });

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(
    mount(
      `/fa/${faPkg.version}`,
      serve(dirname(require.resolve('@fortawesome/fontawesome-free/package.json'))),
    ),
  );

  app.use(
    tinyRouter([
      {
        route: /^\/bulma/,
        get: bulmaHandler,
      },
    ]),
  );

  if (process.env.NODE_ENV !== 'test') {
    app.use(await frontend(webpackConfigs));
  }

  app.use(
    appMapper(
      compose([
        conditional((ctx) => ctx.path.startsWith('/api') || ctx.path === '/oauth2/token', cors()),
        await koas(api(readPackageJson().version, argv), [
          specHandler(),
          swaggerUI({ url: '/api-explorer' }),
          security(authentication(argv) as any),
          parameters(),
          bodyParser({
            parsers: {
              'application/x-www-form-urlencoded': xWwwFormUrlencodedParser,
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
