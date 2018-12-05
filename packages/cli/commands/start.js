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
      default: 3306,
    })
    .option('database-dialect', {
      desc: 'The dialect of the database.',
      default: 'mysql',
      choices: ['mysql', 'postgres'],
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
    });
}

export async function handler(argv) {
  const start = await serverImport('start');
  return start(argv);
}
