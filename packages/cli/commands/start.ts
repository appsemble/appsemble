import { type Argv } from 'yargs';

import { getProjectsBuildConfigs, getProjectWebpackConfig } from '../lib/config.js';
import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'start';
export const description = 'Start the Appsemble development server.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('port', {
      desc: 'The HTTP server port to use. (Development only)',
      type: 'number',
      default: 9999,
    })
    .option('database-host', {
      desc: 'The host of the database to connect to. This defaults to the connected database container.',
    })
    .option('database-port', {
      desc: 'The port of the database to connect to.',
      type: 'number',
      default: 5432,
    })
    .option('database-ssl', {
      desc: 'Use SSL to connect to the database.',
      type: 'boolean',
    })
    .option('database-name', {
      desc: 'The name of the database to connect to.',
      implies: ['database-user', 'database-password'],
    })
    .option('database-user', {
      desc: 'The user to use to login to the database.',
      implies: ['database-name', 'database-password'],
    })
    .option('database-password', {
      desc: 'The password to use to login to the database.',
      implies: ['database-name', 'database-user'],
    })
    .option('database-url', {
      desc: 'A connection string for the database to connect to. This is an alternative to the separate database related variables.',
      conflicts: ['database-host', 'database-name', 'database-user', 'database-password'],
    })
    .option('migrate-to', {
      desc: "To which version to migrate the database. This should be either a semver or 'next'",
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
      implies: 'google-client-secret',
    })
    .option('google-client-secret', {
      desc: 'The secret key to be used for Google OAuth2.',
      implies: 'google-client-id',
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
      implies: 'gitlab-client-secret',
    })
    .option('gitlab-client-secret', {
      desc: 'The secret key to be used for GitLab OAuth2.',
      implies: 'gitlab-client-id',
    })
    .option('secret', {
      desc: 'Secret key used to sign JWTs and cookies',
      required: true,
    })
    .option('aes-secret', {
      desc: 'The key used for all the data that is encrypted using AES.',
      required: true,
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
      desc: 'The external host on which the server is available. This should include the protocol, hostname, and optionally the port.',
      required: true,
    })
    .option('ssl', {
      desc: 'Enable SSL. This is a development flag. It is not the recommended way to use SSL in production.',
      implies: ['ssl-key', 'ssl-cert'],
    })
    .option('ssl-key', {
      desc: 'The SSL key to use, either as a string or as a file path.',
      implies: ['ssl', 'ssl-cert'],
    })
    .option('ssl-cert', {
      desc: 'The SSL certificate to use, either as a string or as a file path.',
      implies: ['ssl', 'ssl-key'],
    })
    .option('s3-host', {
      desc: 'The host of the Amazon S3 compatible object storage server',
    })
    .option('s3-port', {
      desc: 'The port of the Amazon S3 compatible object storage server',
      type: 'number',
      default: 9000,
    })
    .option('s3-secure', {
      desc: 'Whether ssl should be used for the Amazon S3 compatible object storage server',
      type: 'boolean',
      default: true,
    })
    .option('s3-access-key', {
      desc: 'The access key of the Amazon S3 compatible object storage server',
    })
    .option('s3-secret-key', {
      desc: 'The secret key of the Amazon S3 compatible object storage server',
    });
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { setArgv, start } = await serverImport('setArgv', 'start');
  setArgv(argv);
  const projectsBuildConfigs = await getProjectsBuildConfigs(process.cwd());
  const webpackConfigs = await Promise.all(
    projectsBuildConfigs.map((projectBuildConfig) =>
      getProjectWebpackConfig(projectBuildConfig, 'development'),
    ),
  );
  return start({ webpackConfigs });
}
