#!/usr/bin/env node
import faPkg from '@fortawesome/fontawesome-free/package.json';
import boom from 'boom';
import Grant from 'grant-koa';
import Koa from 'koa';
import compress from 'koa-compress';
import mount from 'koa-mount';
import koaQuerystring from 'koa-qs';
import Router from 'koa-router';
import session from 'koa-session';
import serve from 'koa-static';
import koasBodyParser from 'koas-body-parser';
import koas from 'koas-core';
import koasOAuth2Server from 'koas-oauth2-server';
import koasOperations from 'koas-operations';
import koasParameters from 'koas-parameters';
import koasSerializer from 'koas-serializer';
import koasSpecHandler from 'koas-spec-handler';
import koasStatusCode from 'koas-status-code';
import koasSwaggerUI from 'koas-swagger-ui';
import path from 'path';
import querystring from 'querystring';
import raw from 'raw-body';

import api from '../api';
import * as operations from '../controllers';
import boomMiddleware from '../middleware/boom';
import oauth2Handlers from '../middleware/oauth2Handlers';
import oauth2Model from '../middleware/oauth2Model';
import routes from '../routes';

export default async function createServer({
  app = new Koa(),
  argv = {},
  db,
  smtp,
  grantConfig,
  secret = 'appsemble',
}) {
  // eslint-disable-next-line no-param-reassign
  app.keys = [secret];
  app.use(session(app));

  app.use(boomMiddleware);
  Object.assign(app.context, { argv, db });

  let grant;
  if (grantConfig) {
    grant = new Grant(grantConfig);
    const oauthRouter = new Router();
    oauthRouter.get('/api/oauth/connect/:provider', (ctx, next) => {
      const { returnUri, ...query } = ctx.query;
      if (returnUri) {
        ctx.session.returnUri = returnUri;
        ctx.query = query;
      }
      return next();
    });
    oauthRouter.get('/api/oauth/callback/:provider', async ctx => {
      const code = ctx.query;
      const { provider } = ctx.params;
      const { OAuthAuthorization } = ctx.db.models;
      const config = grant.config[provider];
      const handler = oauth2Handlers[provider];
      if (!handler) {
        // unsupported provider
        throw boom.notFound('Unsupported provider');
      }
      const data = await handler(code, config);
      if (!data) {
        throw boom.internal('Unsupported provider');
      }
      const [auth] = await OAuthAuthorization.findOrCreate({
        where: { provider, id: data.id },
        defaults: {
          id: data.id,
          provider,
          token: code.access_token,
          expiresAt: code.raw.expires_in ? code.raw.expires_in : null,
          refreshToken: code.refresh_token,
          verified: data.verified,
        },
      });
      const qs =
        auth.verified && auth.UserId
          ? querystring.stringify({
              access_token: code.access_token,
              refresh_token: code.refresh_token,
              verified: auth.verified,
              userId: auth.UserId,
            })
          : querystring.stringify({
              access_token: code.access_token,
              refresh_token: code.refresh_token,
              provider,
              ...data,
            });
      const returnUri = ctx.session.returnUri ? `${ctx.session.returnUri}?${qs}` : `/?${qs}`;
      ctx.session.returnUri = null;
      ctx.redirect(returnUri);
    });
    app.use(oauthRouter.routes());
    app.use(mount('/api/oauth', grant));
  }

  koaQuerystring(app);

  app.use((ctx, next) => {
    ctx.state.smtp = smtp;
    return next();
  });
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
    await koas(api(), [
      koasSpecHandler(),
      koasSwaggerUI({ url: '/api-explorer' }),
      koasOAuth2Server(oauth2Model({ db, grant, secret })),
      koasParameters(),
      koasBodyParser({
        '*/*': (body, mediaTypeObject, ctx) =>
          raw(body, {
            length: ctx.request.length,
          }),
      }),
      koasSerializer(),
      koasStatusCode(),
      koasOperations({ operations }),
    ]),
  );
  app.use(routes);

  return app.callback();
}
