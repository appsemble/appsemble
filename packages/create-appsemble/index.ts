#!/usr/bin/env node
import { configureLogger, handleError, logger } from '@appsemble/node-utils';
import yargs from 'yargs';

import * as block from './commands/block';

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
    .command(block)
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion().argv;
}

if (module === require.main) {
  try {
    main();
  } catch (error: unknown) {
    logger.error(error);
  }
}
