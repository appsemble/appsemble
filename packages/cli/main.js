import path from 'path';

import { configureLogger, handleError } from '@appsemble/node-utils';
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
      // process.env.NODE_ENV === 'development' ? 'http://localhost:9999' : 'https://appsemble.com',
    })
    .pkgConf('appsembleServer')
    .middleware([configureLogger, initAxios])
    .commandDir(path.join(__dirname, 'commands'))
    .demandCommand(1)
    .fail(handleError)
    .strict()
    .help()
    .completion()
    .parse(argv);
}
