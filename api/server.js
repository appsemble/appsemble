#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import bcrypt from 'bcrypt';
import * as Sentry from '@sentry/node';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import logger from 'koa-logger';
import OAIRouter from 'koa-oai-router';
import OAIRouterMiddleware from 'koa-oai-router-middleware';
import OAIRouterParameters from 'koa-oai-router-parameters';
import Router from 'koa-router';
import session from 'koa-session';
import yaml from 'js-yaml';
import yargs from 'yargs';

import boomMiddleware from './middleware/boom';
import oauth2Model from './middleware/oauth2Model';
import OAuth2Server from './middleware/oauth2Server';
import OAuth2Plugin from './middleware/OAuth2Plugin';
import routes from './routes';
import configureStatic from './utils/configureStatic';
import setupModels from './utils/setupModels';

export function processArgv() {
  const production = process.env.NODE_ENV === 'production';
  const parser = yargs
    .usage('Usage:\n  $0')
    .scriptName(production ? 'docker run -ti appsemble/appsemble' : 'yarn start')
    .help('help', 'Show this help message.')
    .alias('h', 'help')
    .env()
    .wrap(Math.min(180, yargs.terminalWidth()))
    .option('database-host', {
      desc:
        'The host of the database to connect to. This defaults to the connected database container.',
    })
    .option('database-port', {
      desc: 'The port of the database to connect to.',
      type: 'number',
      default: 3306,
    })
    .option('database-dialect', {
      desc: 'The dialect of the database.',
      default: 'mysql',
      choices: ['mysql', 'postgres'],
    })
    .option('database-name', {
      desc: 'The name of the database to connect to.',
      default: production ? undefined : 'appsemble',
      implies: ['database-user', 'database-password'],
    })
    .option('database-user', {
      desc: 'The user to use to login to the database.',
      default: production ? undefined : 'root',
      implies: ['database-name', 'database-password'],
    })
    .option('database-password', {
      desc: 'The password to use to login to the database.',
      default: production ? undefined : 'password',
      implies: ['database-name', 'database-user'],
    })
    .option('database-url', {
      desc:
        'A connection string for the database to connect to. This is an alternative to the separate database related variables.',
      conflicts: [
        'database-host',
        production && 'database-name',
        production && 'database-user',
        production && 'database-password',
      ].filter(Boolean),
    })
    .option('initialize-database', {
      desc: 'Initialize the database, then exit. This wipes any existing data.',
      type: 'boolean',
    })
    .option('sentry-dsn', {
      desc: 'The Sentry DSN to use for error reporting. See https://sentry.io for details.',
      hidden: !production,
    })
    .alias('i', 'initialize-database')
    .option('port', {
      desc: 'The HTTP server port to use. (Development only)',
      type: 'number',
      default: 9999,
      hidden: production,
    })
    .option('smtp-host', {
      desc: 'The host of the SMTP server to connect to.',
    })
    .option('smtp-port', {
      desc: 'The port of the SMTP server to connect to.',
      type: 'number',
    })
    .option('smtp-secure', {
      desc: 'Use TLS when connecting to the SMTP server.',
      type: 'boolean',
      default: false,
    })
    .option('smtp-user', {
      desc: 'The user to use to login to the SMTP server.',
      implies: ['smtp-pass', 'smtp-from'],
    })
    .option('smtp-pass', {
      desc: 'The password to use to login to the SMTP server.',
      implies: ['smtp-user', 'smtp-from'],
    })
    .option('smtp-from', {
      desc: 'The address to use when sending emails.',
      implies: ['smtp-user', 'smtp-pass'],
    })
    .option('oauth-secret', {
      desc: 'Secret key used to sign JWTs and cookies',
      default: 'appsemble',
    });
  return parser.argv;
}

export default async function server({ app = new Koa(), db, smtp, secret = 'appsemble' }) {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(__dirname, 'api'),
    options: {
      middleware: path.join(__dirname, 'controllers'),
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

async function main() {
  const args = processArgv();
  if (args.initializeDatabase) {
    const db = await setupModels({
      sync: true,
      force: true,
      logging: true,
      host: args.databaseHost,
      dialect: args.databaseDialect,
      port: args.databasePort,
      username: args.databaseUser,
      password: args.databasePassword,
      database: args.databaseName,
      uri: args.databaseUrl,
    });
    const { OAuthClient, EmailAuthorization } = db.models;
    await OAuthClient.create({
      clientId: 'appsemble-editor',
      clientSecret: 'appsemble-editor-secret',
      redirectUri: '/editor',
    });
    const email = await EmailAuthorization.create({
      email: 'test@example.com',
      name: 'Test Account',
      password: bcrypt.hashSync('test', 10),
      verified: true,
    });
    await email.createUser();
    await db.close();
    return;
  }

  const db = await setupModels({
    host: args.databaseHost,
    dialect: args.databaseDialect,
    port: args.databasePort,
    username: args.databaseUser,
    password: args.databasePassword,
    database: args.databaseName,
    uri: args.databaseUrl,
  });

  const smtp = args.smtpHost
    ? {
        port: args.smtpPort || args.smtpSecure ? 465 : 587,
        host: args.smtpHost,
        secure: args.smtpSecure,
        ...(args.smtpUser &&
          args.smtpPass && { auth: { user: args.smtpUser, pass: args.smtpPass } }),
        from: args.smtpFrom,
      }
    : undefined;

  const app = new Koa();
  app.use(logger());
  await configureStatic(app);
  if (args.sentryDsn) {
    Sentry.init({ dsn: args.sentryDsn });
    app.use(async (ctx, next) => {
      ctx.state.sentryDsn = args.sentryDsn;
      await next();
    });
  }
  app.on('error', (err, ctx) => {
    // eslint-disable-next-line no-console
    console.error(err);
    Sentry.withScope(scope => {
      scope.setTag('ip', ctx.ip);
      scope.setTag('level', 'error');
      scope.setTag('method', ctx.method);
      scope.setTag('url', `${ctx.URL}`);
      scope.setTag('User-Agent', ctx.headers['user-agent']);
      Sentry.captureException(err);
    });
  });

  await server({ app, db, smtp, secret: args.oauthSecret });
  const { description } = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, 'api', 'api.yaml')),
  ).info;

  app.listen(args.port, '0.0.0.0', () => {
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
