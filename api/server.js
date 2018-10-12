#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import logger from 'koa-logger';
import OAuthServer from 'koa2-oauth-server';
import OAIRouter from 'koa-oai-router';
import OAIRouterMiddleware from 'koa-oai-router-middleware';
import OAIRouterParameters from 'koa-oai-router-parameters';
import session from 'koa-session';
import yaml from 'js-yaml';

import Router from 'koa-router';

import boomMiddleware from './middleware/boom';
import sequelizeMiddleware from './middleware/sequelize';
import oauth2Model from './middleware/oauth2Model';
import routes from './routes';
import configureStatic from './utils/configureStatic';
import setupModels from './utils/setupModels';

const PORT = 9999;

export default function server({
  app = new Koa(),
  db = setupModels({
    sync: true,
    database: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble',
  }),
}) {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(__dirname, 'api'),
    options: {
      middleware: path.join(__dirname, 'controllers'),
      parameters: {},
    },
  });
  oaiRouter.mount(OAIRouterParameters);
  oaiRouter.mount(OAIRouterMiddleware);

  app.keys = [process.env.OAUTH_SECRET || 'appsemble'];
  app.use(session(app));

  app.use(boomMiddleware);
  app.use(sequelizeMiddleware(db));

  const model = oauth2Model(db);
  const oauth = new OAuthServer({
    model,
    requireClientAuthentication: false,
    grants: ['password'],
    debug: true,
  });
  const oauthRouter = new Router();
  oauthRouter.post('/oauth/authorize', oauth.authorize());
  oauthRouter.post('/oauth/token', oauth.token());
  oauthRouter.post('/login', async ctx => {
    const user = await model.getUser(ctx.request.body.username, ctx.request.body.password);

    if (!user) {
      ctx.body = 'invalid login';
      return;
    }

    ctx.session.userId = user.id;

    if (ctx.session.hasOwnProperty('query')) {
      ctx.redirect('/oauth/authorize');
      return;
    }
    ctx.redirect('/');
  });

  oauthRouter.get('/login', ctx => {
    ctx.response.body =
      '<html><body><form action="/login" method="post">' +
      '<h1>Ye olde login form</h1>' +
      '<p>Sign in as wessel@d-centralize.nl:password</p>' +
      '<input type="email" name="username" value="wessel@d-centralize.nl">' +
      '<input type="password" name="password" value="password">' +
      '<input type="submit" value="Sign in">' +
      '</form></body></html>';
  });

  oauthRouter.get('/oauth/authorize', ctx => {
    if (!ctx.session.userId) {
      ctx.session.query = {
        state: ctx.request.query.state,
        scope: ctx.request.query.scope,
        client_id: ctx.request.query.client_id,
        redirect_uri: ctx.request.query.redirect_uri,
        response_type: ctx.request.query.response_type,
      };

      ctx.redirect('/login');
      return;
    }

    const client = model.getClient(ctx.session.query.client_id);

    if (!client) {
      ctx.throw(401, 'No such client');
    }

    ctx.response.body =
      `<html><body><h1>Grant access to "${client.id}"?</h1>` +
      `<p>The application requests access to ${ctx.session.query.scope}</p>` +
      '<form action="/oauth/authorize" method="post">' +
      '<input type="submit" value="Grant access"></form></body></html>';
  });

  oauthRouter.post(
    '/oauth/authorize',
    (ctx, next) => {
      if (!ctx.session.userId) {
        ctx.redirect('/login');
        return;
      }

      ctx.request.body = ctx.session.query;
      ctx.request.body.user_id = ctx.session.userId;
      ctx.session.query = null;

      return next();
    },
    oauth.authorize({
      authenticateHandler: {
        handle: async (req, res) => db.User.find({ where: { id: req.body.user_id } }),
      },
    }),
  );

  app.use(bodyParser());
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(oauthRouter.routes());
  app.use(oaiRouter.routes());
  app.use(routes);

  return app.callback();
}

async function main() {
  const app = new Koa();
  app.use(logger());
  await configureStatic(app);

  server({ app });
  const { description } = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, 'api', 'api.yaml')),
  ).info;

  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(description);
  });
}

if (module === require.main) {
  main().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
