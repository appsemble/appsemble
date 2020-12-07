import { configureAxios, configureLogger, handleError } from '@appsemble/node-utils';
import yargs, { CommandModule } from 'yargs';

import * as cleanup from './commands/cleanup';
import * as cleanupResources from './commands/cleanupResources';
import * as health from './commands/health';
import * as migrate from './commands/migrate';
import * as restore from './commands/restore';
import * as runCronJobs from './commands/runCronJobs';
import * as start from './commands/start';
import { readPackageJson } from './utils/readPackageJson';

/**
 * These are exported, so @appsemble/cli can wrap them.
 */
const startHandler = start.handler;
const migrateHandler = migrate.handler;
const cleanupResourcesHandler = cleanupResources.handler;
const runCronJobsHandler = runCronJobs.handler;

export {
  startHandler as start,
  migrateHandler as migrate,
  cleanupResourcesHandler as cleanupResources,
  runCronJobsHandler as runCronJobs,
};

/**
 * The main entry point for the Appsemble production server.
 *
 * @param argv - The argument vector passed in from the command line.
 */
function main(argv: string[]): void {
  const { version } = readPackageJson();
  configureAxios('AppsembleServer', version);

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
    .parse(argv);
}

if (module === require.main) {
  main(process.argv.slice(2));
}
