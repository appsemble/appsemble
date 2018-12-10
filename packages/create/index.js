import path from 'path';

import yargs from 'yargs';

import handleError from './lib/handleError';
import initLogging from './lib/initLogging';

export default async argv => {
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
    .middleware([initLogging])
    .commandDir(path.join(__dirname, 'commands'))
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion()
    .parse(argv);
};
