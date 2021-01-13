import http from 'http';
import https from 'https';

import { logger, readFileOrString } from '@appsemble/node-utils';
import { api, asciiLogo } from '@appsemble/utils';
import { captureException, init, withScope } from '@sentry/node';
import { Configuration } from 'webpack';
import { Argv } from 'yargs';

import { migrations } from '../migrations';
import { initDB } from '../models';
import { Argv as Args } from '../types';
import { createServer } from '../utils/createServer';
import { configureDNS } from '../utils/dns';
import { migrate } from '../utils/migrate';
import { readPackageJson } from '../utils/readPackageJson';
import { handleDBError } from '../utils/sqlUtils';
import { databaseBuilder } from './builder/database';

interface AdditionalArguments {
  webpackConfigs?: Configuration[];
}

export const PORT = 9999;
export const command = 'start';
export const description = 'Start the Appsemble server';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('sentry-dsn', {
      desc: 'The Sentry DSN to use for error reporting. See https://sentry.io for details.',
    })
    .option('sentry-environment', {
      desc: 'The Sentry environment to use for error reporting. See https://sentry.io for details.',
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
    .option('google-client-id', {
      desc: 'The application key to be used for Google OAuth2.',
      implies: ['google-client-secret'],
    })
    .option('google-client-secret', {
      desc: 'The secret key to be used for Google OAuth2.',
      implies: ['google-client-id'],
    })
    .option('github-client-id', {
      desc: 'The application key to be used for GitHub OAuth2.',
      implies: 'github-client-secret',
    })
    .option('github-client-secret', {
      desc: 'The secret key to be used for GitHub OAuth2.',
      implies: 'github-client-id',
    })
    .option('gitlab-client-id', {
      desc: 'The application key to be used for GitLab OAuth2.',
      implies: ['gitlab-client-secret'],
    })
    .option('gitlab-client-secret', {
      desc: 'The secret key to be used for GitLab OAuth2.',
      implies: ['gitlab-client-id'],
    })
    .option('secret', {
      desc: 'Secret key used to sign JWTs and cookies',
      required: true,
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
    .option('ingress-annotations', {
      desc: 'A JSON string representing ingress annotations to add to created ingresses.',
      implies: ['service-name', 'service-port'],
    })
    .option('service-name', {
      desc:
        'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-port'],
    })
    .option('service-port', {
      desc:
        'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-name'],
    })
    .option('host', {
      desc:
        'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      required: true,
    })
    .option('proxy', {
      desc: 'Trust proxy headers. This is used to detect the source IP for logging.',
      default: false,
    });
}

export async function handler(
  argv: Args,
  { webpackConfigs }: AdditionalArguments = {},
): Promise<void> {
  const { version } = readPackageJson();
  try {
    initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  if (argv.migrateTo) {
    await migrate(argv.migrateTo, migrations);
  }

  await configureDNS(argv);

  if (argv.sentryDsn) {
    init({ dsn: argv.sentryDsn, environment: argv.sentryEnvironment, release: version });
  }

  const app = await createServer({ argv, webpackConfigs });

  app.on('error', (err, ctx) => {
    if (err.expose) {
      // It is thrown by `ctx.throw()` or `ctx.assert()`.
      return;
    }
    logger.error(err);
    withScope((scope) => {
      scope.setTag('ip', ctx.ip);
      scope.setTag('level', 'error');
      scope.setTag('method', ctx.method);
      scope.setTag('url', String(ctx.URL));
      scope.setTag('User-Agent', ctx.headers['user-agent']);
      captureException(err);
    });
  });

  const callback = app.callback();
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
    logger.info(api(version, argv).info.description);
  });
}
