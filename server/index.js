#!/usr/bin/env node
import yargs from 'yargs';

import * as initialize from './commands/initialize';
import * as start from './commands/start';

function main(argv) {
  const production = process.env.NODE_ENV === 'production';
  yargs
    .usage('Usage:\n  $0 [command]')
    .scriptName(production ? 'docker run -ti appsemble/appsemble' : 'yarn')
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
