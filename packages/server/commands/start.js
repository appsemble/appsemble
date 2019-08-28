import { logger, loggerMiddleware } from '@appsemble/node-utils';
import { asciiLogo } from '@appsemble/utils';
import * as Sentry from '@sentry/node';
import http from 'http';
import http2 from 'http2';
import Koa from 'koa';

import api from '../api';
import migrations from '../migrations';
import pkg from '../package.json';
import configureStatic from '../utils/configureStatic';
import createServer from '../utils/createServer';
import migrate from '../utils/migrate';
import readFileOrString from '../utils/readFileOrString';
import setupModels, { handleDbException } from '../utils/setupModels';
import databaseBuilder from './builder/database';

export const PORT = 9999;
export const command = 'start';
export const description = 'Start the Appsemble server';

export function builder(yargs) {
  return databaseBuilder(yargs)
    .option('sentry-dsn', {
      desc: 'The Sentry DSN to use for error reporting. See https://sentry.io for details.',
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
    .option('oauth-google-key', {
      desc: 'The application key to be used for Google OAuth2.',
      implies: ['host', 'oauth-google-secret'],
    })
    .option('oauth-google-secret', {
      desc: 'The secret key to be used for Google OAuth2.',
      implies: ['host', 'oauth-google-key'],
    })
    .option('oauth-gitlab-key', {
      desc: 'The application key to be used for GitLab OAuth2.',
      implies: ['host', 'oauth-gitlab-secret'],
    })
    .option('oauth-gitlab-secret', {
      desc: 'The secret key to be used for GitLab OAuth2.',
      implies: ['host', 'oauth-gitlab-key'],
    })
    .option('oauth-secret', {
      desc: 'Secret key used to sign JWTs and cookies',
      default: 'appsemble',
    })
    .option('disable-registration', {
      desc: 'If specified, user registration will be disabled on the server',
      type: 'boolean',
      default: false,
    })
    .option('host', {
      desc:
        'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
    });
}

export async function handler(argv, { webpackConfigs, syncDB } = {}) {
  let db;

  try {
    db = await setupModels({
      host: argv.databaseHost,
      dialect: argv.databaseDialect,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      uri: argv.databaseUrl,
    });
  } catch (dbException) {
    handleDbException(dbException);
  }

  if (syncDB) {
    await migrate(db, pkg.version, migrations);
  }

  const app = new Koa();
  app.use(loggerMiddleware());
  await configureStatic(app, webpackConfigs);
  if (argv.sentryDsn) {
    Sentry.init({ dsn: argv.sentryDsn });
  }
  app.on('error', (err, ctx) => {
    logger.error(err);
    Sentry.withScope(scope => {
      scope.setTag('ip', ctx.ip);
      scope.setTag('level', 'error');
      scope.setTag('method', ctx.method);
      scope.setTag('url', `${ctx.URL}`);
      scope.setTag('User-Agent', ctx.headers['user-agent']);
      Sentry.captureException(err);
    });
  });

  let grantConfig;
  if (argv.oauthGitlabKey || argv.oauthGoogleKey) {
    const { protocol, host } = new URL(argv.host);
    grantConfig = {
      server: {
        // URL.protocol leaves a ´:´ in.
        protocol: protocol.replace(':', ''),
        host,
        path: '/api/oauth',
        callback: '/api/oauth/callback',
      },
      ...(argv.oauthGitlabKey && {
        gitlab: {
          key: argv.oauthGitlabKey,
          secret: argv.oauthGitlabSecret,
          scope: ['read_user'],
          callback: '/api/oauth/callback/gitlab',
        },
      }),
      ...(argv.oauthGoogleKey && {
        google: {
          key: argv.oauthGoogleKey,
          secret: argv.oauthGoogleSecret,
          scope: ['email', 'profile', 'openid'],
          callback: '/api/oauth/callback/google',
          custom_params: { access_type: 'offline' },
        },
      }),
    };
  }

  await createServer({ app, argv, db, grantConfig, secret: argv.oauthSecret });
  const httpServer = argv.ssl
    ? http2.createSecureServer(
        {
          key: await readFileOrString(argv.sslKey),
          cert: await readFileOrString(argv.sslCert),
        },
        app.callback(),
      )
    : http.createServer(app.callback());

  httpServer.listen(argv.port || PORT, '0.0.0.0', () => {
    logger.info(asciiLogo);
    logger.info(api(argv).info.description);
  });
}
