import { configureLogger, handleError } from '@appsemble/node-utils';
import path from 'path';
import yargs from 'yargs';

import initAxios from './lib/initAxios';

export default async function main(argv) {
  yargs
    .option('verbose', {
      alias: 'v',
      describe: 'Increase verbosity',
      type: 'count',
    })
    .option('quiet', {
      alias: 'q',
      describe: 'Decrease verbosity',
      type: 'count',
    })
    .option('remote', {
      description: 'The Appsemble host that should be used.',
      default: 'http://localhost:9999',
    })
    .option('client-credentials', {
      description: 'OAuth2 client credentials formatted as "client_id:client_secret".',
    })
    .pkgConf('appsembleServer')
    .middleware([configureLogger, initAxios])
    .commandDir(path.join(__dirname, 'commands'))
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion()
    .parse(argv);
}
