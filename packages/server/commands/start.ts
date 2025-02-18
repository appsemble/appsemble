import http from 'node:http';
import https from 'node:https';

import { initS3Client, logger, readFileOrString, version } from '@appsemble/node-utils';
import { api, asciiLogo } from '@appsemble/utils';
import { captureException } from '@sentry/node';
import { type Context } from 'koa';
import { type Configuration } from 'webpack';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { configureDNS } from '../utils/dns/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { syncTrainings } from '../utils/syncTrainings.js';

interface AdditionalArguments {
  webpackConfigs?: Configuration[];
}

export const PORT = 9999;
export const command = 'start';
export const description = 'Start the Appsemble server';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
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
    .option('sentry-allowed-domains', {
      desc: 'Domains for apps where Sentry integration should be injected if Sentry is configured. Comma separated domains and wildcards are allowed.',
      default: '*',
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
    .option('ingress-class-name', {
      desc: 'The class name of the ingresses to create.',
      default: 'nginx',
    })
    .option('issuer', {
      desc: 'The name of the cert-manager issuer to use for apps.',
      conflicts: ['cluster-issuer'],
    })
    .option('cluster-issuer', {
      desc: 'The name of the cert-manager cluster issuer to use for apps.',
      conflicts: ['issuer'],
    })
    .option('ingress-annotations', {
      desc: 'A JSON string representing ingress annotations to add to created ingresses.',
      implies: ['service-name', 'service-port'],
    })
    .option('service-name', {
      desc: 'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-port'],
    })
    .option('service-port', {
      desc: 'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-name'],
    })
    .option('host', {
      desc: 'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      required: true,
    })
    .option('port', {
      desc: 'The port to use for the server. Default is 9999',
      default: 9999,
    })
    .option('remote', {
      desc: 'The remote that will be used for downloading unknown blocks. For example: https://appsemble.app',
    })
    .option('proxy', {
      desc: 'Trust proxy headers. This is used to detect the source IP for logging.',
      default: false,
    });
}

export async function handler({ webpackConfigs }: AdditionalArguments = {}): Promise<void> {
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

  try {
    initS3Client({
      endPoint: argv.s3Host,
      port: argv.s3Port,
      useSSL: argv.s3Secure,
      accessKey: argv.s3AccessKey,
      secretKey: argv.s3SecretKey,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
  }

  if (argv.migrateTo) {
    await migrate(argv.migrateTo, migrations);
  }

  try {
    await syncTrainings('trainings');
  } catch (error: unknown) {
    logger.warn('Trainings failed to sync');
    logger.warn(error);
  }

  await configureDNS();

  const app = await createServer({ webpackConfigs });

  app.on('error', (err, ctx: Context) => {
    if (err.expose) {
      // It is thrown by `ctx.throw()` or `ctx.assert()`.
      return;
    }
    logger.error(err);
    captureException(err, {
      tags: {
        ip: ctx.ip,
        method: ctx.method,
        url: ctx.href,
        'User-Agent': ctx.headers['user-agent'],
      },
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

  httpServer.listen(argv.port || PORT, '::', () => {
    logger.info(asciiLogo);
    logger.info(api(version, argv).info.description);
  });
}
