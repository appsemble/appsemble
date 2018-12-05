#!/usr/bin/env node
import yargs from 'yargs';

import * as initialize from './commands/initialize';
import * as start from './commands/start';

/**
 * These are exported, so @appsemble/cli can wrap them.
 */
const startHandler = start.handler;
const initializeHandler = initialize.handler;

export { initializeHandler as initialize };
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
    .command(start)
    .command(initialize)
    .help('help', 'Show this help message.')
    .alias('h', 'help')
    .env()
    .wrap(Math.min(180, yargs.terminalWidth()))
    .parse(argv);
}

if (module === require.main) {
  main(process.argv.slice(2));
}
