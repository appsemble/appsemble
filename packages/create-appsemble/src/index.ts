#!/usr/bin/env node
import { commandDirOptions, configureLogger, handleError, logger } from '@appsemble/node-utils';
import yargs from 'yargs';

async function main(): Promise<any> {
  return yargs
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
    .commandDir(...commandDirOptions(__filename))
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion().argv;
}

if (module === require.main) {
  main().catch((error) => logger.error(error));
}
