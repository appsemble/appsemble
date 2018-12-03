import path from 'path';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import OAIRouter from 'koa-oai-router';
import OAIRouterMiddleware from 'koa-oai-router-middleware';
import OAIRouterParameters from 'koa-oai-router-parameters';
import Router from 'koa-router';
import session from 'koa-session';

import boomMiddleware from '../middleware/boom';
import oauth2Model from '../middleware/oauth2Model';
import OAuth2Server from '../middleware/oauth2Server';
import OAuth2Plugin from '../middleware/OAuth2Plugin';
import routes from '../routes';

export default async function createServer({ app = new Koa(), db, smtp, secret = 'appsemble' }) {
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

  const model = oauth2Model({ db, secret });
  const oauth = new OAuth2Server({
    model,
    requireClientAuthentication: { password: false },
    grants: ['password', 'refresh_token'],
    useErrorHandler: true,
    debug: true,
  });

  const oauthRouter = new Router();
  oauthRouter.post('/api/oauth/authorize', oauth.authorize());
  oauthRouter.post('/api/oauth/token', oauth.token());

  app.use(bodyParser());
  app.use((ctx, next) => {
    ctx.state.smtp = smtp;
    return next();
  });
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(oauth.authenticate());
  app.use(oauthRouter.routes());
  app.use(oaiRouter.routes());

  app.use(oaiRouter.routes());
  app.use(routes);

  await oaiRouterStatus;
  // eslint-disable-next-line no-param-reassign
  app.context.api = oaiRouter.api;

  return app.callback();
}
