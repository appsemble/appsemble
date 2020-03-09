import { configureLogger, handleError } from '@appsemble/node-utils';
import path from 'path';
import yargs from 'yargs';

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
    .middleware([configureLogger])
    .commandDir(path.join(__dirname, 'commands'))
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion()
    .parse(argv);
};
