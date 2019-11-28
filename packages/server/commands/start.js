import { logger } from '@appsemble/node-utils';
import { asciiLogo } from '@appsemble/utils';
import * as Sentry from '@sentry/node';
import http from 'http';
import https from 'https';
import Koa from 'koa';

import api from '../api';
import migrations from '../migrations';
import pkg from '../package.json';
import addDBHooks from '../utils/addDBHooks';
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
      implies: ['oauth-google-secret'],
    })
    .option('oauth-google-secret', {
      desc: 'The secret key to be used for Google OAuth2.',
      implies: ['oauth-google-key'],
    })
    .option('oauth-gitlab-key', {
      desc: 'The application key to be used for GitLab OAuth2.',
      implies: ['oauth-gitlab-secret'],
    })
    .option('oauth-gitlab-secret', {
      desc: 'The secret key to be used for GitLab OAuth2.',
      implies: ['oauth-gitlab-key'],
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
    .option('app-domain-strategy', {
      desc: 'How to link app domain names to apps',
      choices: ['kubernetes-ingress'],
    })
    .option('ingress-name', {
      desc: 'The name of the ingress to patch if app-domain-strategy is set to kubernetes-ingress',
      implies: ['ingress-service-name', 'ingress-service-port'],
    })
    .option('ingress-service-name', {
      desc:
        'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['ingress-name', 'ingress-service-port'],
    })
    .option('ingress-service-port', {
      desc:
        'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['ingress-name', 'ingress-service-name'],
      type: 'number',
    })
    .option('host', {
      desc:
        'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      required: true,
    });
}

export async function handler(argv, { webpackConfigs, syncDB } = {}) {
  let db;

  try {
    db = await setupModels({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (dbException) {
    handleDbException(dbException);
  }

  if (syncDB) {
    await migrate(db, pkg.version, migrations);
  }

  await addDBHooks(db, argv);

  const app = new Koa();
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

  const callback = await createServer({ app, argv, db, secret: argv.oauthSecret, webpackConfigs });
  const httpServer = argv.ssl
    ? https.createServer(
        {
          key: await readFileOrString(argv.sslKey),
          cert: await readFileOrString(argv.sslCert),
        },
        callback,
      )
    : http.createServer(callback);

  httpServer.listen(argv.port || PORT, '0.0.0.0', () => {
    logger.info(asciiLogo);
    logger.info(api(argv).info.description);
  });
}
