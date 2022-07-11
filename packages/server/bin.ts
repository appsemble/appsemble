#!/usr/bin/env node
import { configureAxios, configureLogger, handleError } from '@appsemble/node-utils';
import yargs, { CommandModule } from 'yargs';

import * as cleanup from './commands/cleanup';
import * as cleanupResources from './commands/cleanupResources';
import * as health from './commands/health';
import * as migrate from './commands/migrate';
import * as restore from './commands/restore';
import * as runCronJobs from './commands/runCronJobs';
import * as start from './commands/start';
import pkg from './package.json';
import './types';
import { setArgv } from './utils/argv';
import { configureSentry } from './utils/sentry';

process.title = 'appsemble';

configureAxios('AppsembleServer', pkg.version);

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
  .option('sentry-dsn', {
    desc: 'The Sentry DSN to use for error reporting. See https://sentry.io for details.',
  })
  .option('sentry-environment', {
    desc: 'The Sentry environment to use for error reporting. See https://sentry.io for details.',
  })
  .middleware([setArgv, configureLogger, configureSentry])
  .command(cleanup as CommandModule)
  .command(cleanupResources as CommandModule)
  .command(runCronJobs as CommandModule)
  .command(health as CommandModule)
  .command(start as CommandModule)
  .command(migrate as CommandModule)
  .command(restore as CommandModule)
  .fail(handleError)
  .help('help', 'Show this help message.')
  .alias('h', 'help')
  .env()
  .wrap(Math.min(180, yargs.terminalWidth()))
  .parse(process.argv.slice(2));
