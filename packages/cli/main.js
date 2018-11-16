import path from 'path';

import yargs from 'yargs';

import handleError from './lib/handleError';
import initAxios from './lib/initAxios';
import initLogging from './lib/initLogging';

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
    .middleware([initLogging, initAxios])
    .commandDir(path.join(__dirname, 'commands'))
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion()
    .parse(argv);
}
