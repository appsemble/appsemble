#!/usr/bin/env node
import { extname, join } from 'path';

import { configureLogger, handleError, logger } from '@appsemble/node-utils';
import yargs from 'yargs';

function main(): any {
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
    .commandDir(join(__dirname, 'commands'), {
      extensions: [extname(__filename).slice(1)],
    })
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion().argv;
}

if (module === require.main) {
  try {
    main();
  } catch (error) {
    logger.error(error);
  }
}
