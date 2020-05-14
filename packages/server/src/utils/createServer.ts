import { loggerMiddleware } from '@appsemble/node-utils';
import { api } from '@appsemble/utils';
import faPkg from '@fortawesome/fontawesome-free/package.json';
import Boom from '@hapi/boom';
import cors from '@koa/cors';
import isIp from 'is-ip';
import Koa from 'koa';
import compose from 'koa-compose';
import compress from 'koa-compress';
import mount from 'koa-mount';
import koaQuerystring from 'koa-qs';
import range from 'koa-range';
import session from 'koa-session';
import serve from 'koa-static';
import koasBodyParser from 'koas-body-parser';
import koas from 'koas-core';
import koasOperations from 'koas-operations';
import koasParameters from 'koas-parameters';
import koasSecurity from 'koas-security';
import koasSerializer from 'koas-serializer';
import koasSpecHandler from 'koas-spec-handler';
import koasStatusCode from 'koas-status-code';
import koasSwaggerUI from 'koas-swagger-ui';
import path from 'path';
import raw from 'raw-body';
import type { Configuration } from 'webpack';

import * as operations from '../controllers';
import appMapper from '../middleware/appMapper';
import boom from '../middleware/boom';
import conditional from '../middleware/conditional';
import frontend from '../middleware/frontend';
import oauth2 from '../middleware/oauth2';
import tinyRouter from '../middleware/tinyRouter';
import { appRouter, studioRouter } from '../routes';
import bulmaHandler from '../routes/bulmaHandler';
import type { Argv } from '../types';
import authentication from './authentication';
import convertToCsv from './convertToCsv';
import Mailer from './email/Mailer';
import readPackageJson from './readPackageJson';

interface CreateServerOptions {
  app?: Koa;
  argv: Argv;
  webpackConfigs?: Configuration[];
}

export default async function createServer({
  app = new Koa(),
  argv = {},
  webpackConfigs,
}: CreateServerOptions): Promise<Koa> {
  // eslint-disable-next-line no-param-reassign
  app.keys = [argv.secret];
  app.use(loggerMiddleware());
  app.use(session(app));

  app.use(boom());
  app.use(range);
  Object.assign(app.context, { argv, mailer: new Mailer(argv) });

  koaQuerystring(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(
    mount(
      `/fa/${faPkg.version}`,
      serve(path.dirname(require.resolve('@fortawesome/fontawesome-free/package.json'))),
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

  const apiMiddleware = mount(
    '/api',
    compose([
      await koas(api(readPackageJson().version, argv), [
        koasSpecHandler(),
        koasSwaggerUI({ url: '/explorer' }),
        koasSecurity(authentication(argv) as any),
        koasParameters(),
        koasBodyParser({
          parsers: {
            '*/*': (body, _mediaTypeObject, ctx) => raw(body, { length: ctx.request.length }),
          },
        }),
        koasSerializer({
          'text/csv': convertToCsv,
        }),
        koasStatusCode(),
        koasOperations({ operations } as any),
      ]),
      ({ hostname }, next) => {
        if (new URL(argv.host).hostname === hostname || isIp(hostname)) {
          throw Boom.notFound('URL not found');
        }
        return next();
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
        apiMiddleware,
        studioRouter,
        oauth2(argv),
      ]),
      compose([apiMiddleware, appRouter]),
    ),
  );

  return app;
}
