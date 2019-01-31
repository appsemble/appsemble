#!/usr/bin/env node
import path from 'path';
import querystring from 'querystring';

import faPkg from '@fortawesome/fontawesome-free/package.json';
import boom from 'boom';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import Grant from 'grant-koa';
import mount from 'koa-mount';
import koaQuerystring from 'koa-qs';
import OAIRouter from 'koa-oai-router';
import OAIRouterMiddleware from 'koa-oai-router-middleware';
import OAIRouterParameters from 'koa-oai-router-parameters';
import Router from 'koa-router';
import serve from 'koa-static';
import session from 'koa-session';

import boomMiddleware from '../middleware/boom';
import oauth2Handlers from '../middleware/oauth2Handlers';
import oauth2Model from '../middleware/oauth2Model';
import OAuth2Server from '../middleware/oauth2Server';
import OAuth2Plugin from '../middleware/OAuth2Plugin';
import routes from '../routes';

export default async function createServer({
  app = new Koa(),
  db,
  smtp,
  grantConfig,
  secret = 'appsemble',
}) {
  const oaiRouter = new OAIRouter({
    apiDoc: path.resolve(__dirname, '../api'),
    options: {
      middleware: path.resolve(__dirname, '../controllers'),
      parameters: {},
      oauth: {},
    },
  });

  const oaiRouterStatus = new Promise((resolve, reject) => {
    oaiRouter.on('ready', resolve);
    oaiRouter.on('error', reject);
  });

  await oaiRouter.mount(OAIRouterParameters);
  await oaiRouter.mount(OAuth2Plugin);
  await oaiRouter.mount(OAIRouterMiddleware);

  // eslint-disable-next-line no-param-reassign
  app.keys = [secret];
  app.use(session(app));

  app.use(boomMiddleware);
  // eslint-disable-next-line no-param-reassign
  app.context.db = db;

  let grant;
  if (grantConfig) {
    grant = new Grant(grantConfig);
  }
  const model = oauth2Model({ db, grant, secret });

  const oauth = new OAuth2Server({
    model,
    requireClientAuthentication: { password: false },
    grants: ['password', 'refresh_token', 'authorization_code'],
    useErrorHandler: true,
    debug: true,
  });

  const oauthRouter = new Router();
  oauthRouter.post('/api/oauth/authorize', oauth.authorize());
  oauthRouter.post('/api/oauth/token', oauth.token());

  if (grantConfig) {
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
  }

  app.use(bodyParser());
  koaQuerystring(app);

  app.use((ctx, next) => {
    ctx.state.smtp = smtp;
    return next();
  });
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(oauth.authenticate());
  app.use(oauthRouter.routes());
  if (grantConfig) {
    app.use(mount('/api/oauth', grant));
  }

  app.use(
    mount(
      `/fa/${faPkg.version}`,
      serve(path.dirname(require.resolve('@fortawesome/fontawesome-free/package.json'))),
    ),
  );

  app.use(oaiRouter.routes());
  app.use(routes);

  await oaiRouterStatus;
  // eslint-disable-next-line no-param-reassign
  app.context.api = oaiRouter.api;

  return app.callback();
}
