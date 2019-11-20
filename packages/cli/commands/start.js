import discoverBlocks from '../lib/discoverBlocks';
import loadWebpackConfig from '../lib/loadWebpackConfig';
import serverImport from '../lib/serverImport';

export const command = 'start';
export const description = 'Start the Appsemble development server.';

export function builder(yargs) {
  return yargs
    .option('port', {
      desc: 'The HTTP server port to use. (Development only)',
      type: 'number',
      default: 9999,
    })
    .option('webpack-config', {
      desc: 'The webpack configuration file to use for blocks.',
      alias: 'c',
      default: 'webpack.config',
      normalize: true,
    })
    .option('database-host', {
      desc:
        'The host of the database to connect to. This defaults to the connected database container.',
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
      desc:
        'A connection string for the database to connect to. This is an alternative to the separate database related variables.',
      conflicts: ['database-host', 'database-name', 'database-user', 'database-password'],
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
      implies: 'oauth-google-secret',
    })
    .option('oauth-google-secret', {
      desc: 'The secret key to be used for Google OAuth2.',
      implies: 'oauth-google-key',
    })
    .option('oauth-gitlab-key', {
      desc: 'The application key to be used for GitLab OAuth2.',
      implies: 'oauth-gitlab-secret',
    })
    .option('oauth-gitlab-secret', {
      desc: 'The secret key to be used for GitLab OAuth2.',
      implies: 'oauth-gitlab-key',
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
        'The external host on which the server is available. This should include the protocol, hostname, and optionally the port.',
      required: true,
    })
    .option('ssl', {
      desc:
        'Enable SSL. This is a development flag. It is not the recommended way to use SSL in production.',
      implies: ['ssl-key', 'ssl-cert'],
    })
    .option('ssl-key', {
      desc: 'The SSL key to use, either as a string or as a file path.',
      implies: ['ssl', 'ssl-cert'],
    })
    .option('ssl-cert', {
      desc: 'The SSL certificate to use, either as a string or as a file path.',
      implies: ['ssl', 'ssl-key'],
    });
}

export async function handler(argv) {
  const start = await serverImport('start');
  const blocks = await discoverBlocks(process.cwd());
  const webpackConfigs = await Promise.all(
    blocks.map(block =>
      loadWebpackConfig(argv.webpackConfig, block.id, {
        mode: 'development',
        publicPath: `/api/blocks/${block.id}/versions/${block.version}`,
      }),
    ),
  );
  return start(argv, { webpackConfigs, syncDB: true });
}
