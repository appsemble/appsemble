#!/usr/bin/env node
import { configureAxios, configureLogger, handleError, version } from '@appsemble/node-utils';
import yargs, { type CommandModule } from 'yargs';

import * as checkDownMigrations from './commands/checkDownMigrations.js';
import * as checkMigrations from './commands/checkMigrations.js';
import * as cleanup from './commands/cleanup.js';
import * as cleanupDemoAppMembers from './commands/cleanupDemoAppMembers.js';
import * as cleanupResourcesAndAssets from './commands/cleanupResourcesAndAssets.js';
import * as cleanupSoftDeletedRecords from './commands/cleanupSoftDeletedRecords.js';
import * as fuzzMigrations from './commands/fuzzMigrations.js';
import * as health from './commands/health.js';
import * as migrate from './commands/migrate.js';
import * as migrateAppDefinitions from './commands/migrateAppDefinitions.js';
import * as restore from './commands/restore.js';
import * as runCronJobs from './commands/runCronJobs.js';
import * as scaleContainers from './commands/scaleContainers.js';
import * as start from './commands/start.js';
import './types.js';
import { setArgv } from './utils/argv.js';
import { configureSentry } from './utils/sentry.js';

process.title = 'appsemble-server';

configureAxios('AppsembleServer', version);

const parser = yargs()
  .usage('Usage:\n  $0 [command]')
  .version(version)
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
  .command(cleanupResourcesAndAssets as CommandModule)
  .command(cleanupDemoAppMembers as CommandModule)
  .command(checkMigrations as CommandModule)
  .command(checkDownMigrations as CommandModule)
  .command(fuzzMigrations as CommandModule)
  .command(runCronJobs as CommandModule)
  .command(health as CommandModule)
  .command(scaleContainers as CommandModule)
  .command(start as CommandModule)
  .command(migrate as CommandModule)
  .command(migrateAppDefinitions as CommandModule)
  .command(restore as CommandModule)
  .command(cleanupSoftDeletedRecords)
  .fail(handleError)
  .help('help', 'Show this help message.')
  .alias('h', 'help')
  .env();
parser.wrap(Math.min(180, parser.terminalWidth())).parse(process.argv.slice(2));
