#!/usr/bin/env node
import { configureLogger, handleError } from '@appsemble/node-utils';
import yargs from 'yargs';

import * as start from './commands/start';

/**
 * These are exported, so @appsemble/cli can wrap them.
 */
const startHandler = start.handler;

// eslint-disable-next-line import/prefer-default-export
export { startHandler as start };

/**
 * The main entry point for the Appsemble production server.
 *
 * @param {string[]} argv The argument vector passed in from the command line.
 */
function main(argv) {
  yargs
    .usage('Usage:\n  $0 [command]')
    .scriptName(`docker run -p ${start.PORT} -ti appsemble/appsemble`)
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
    .command(start)
    .fail(handleError)
    .help('help', 'Show this help message.')
    .alias('h', 'help')
    .env()
    .wrap(Math.min(180, yargs.terminalWidth()))
    .parse(argv);
}

if (module === require.main) {
  main(process.argv.slice(2));
}
