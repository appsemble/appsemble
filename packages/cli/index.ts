#!/usr/bin/env node
import process from 'node:process';

import { configureLogger, CREDENTIALS_ENV_VAR, handleError, version } from '@appsemble/node-utils';
import { cosmiconfig } from 'cosmiconfig';
import yargs, { type CommandModule } from 'yargs';

import * as app from './commands/app/index.js';
import * as asset from './commands/asset/index.js';
import * as block from './commands/block/index.js';
import * as checkDownMigrations from './commands/checkDownMigrations.js';
import * as checkMigrations from './commands/checkMigrations.js';
import * as cleanupDemoAppMembers from './commands/cleanupDemoAppMembers.js';
import * as cleanupResourcesAndAssets from './commands/cleanupResourcesAndAssets.js';
import * as cleanupSoftDeletedRecords from './commands/cleanupSoftDeletedRecords.js';
import * as config from './commands/config/index.js';
import * as fuzzMigrations from './commands/fuzzMigrations.js';
import * as group from './commands/group/index.js';
import * as login from './commands/login.js';
import * as logout from './commands/logout.js';
import * as migrate from './commands/migrate.js';
import * as migrateAppDefinitions from './commands/migrateAppDefinitions.js';
import * as organization from './commands/organization/index.js';
import * as resource from './commands/resource/index.js';
import * as runCronJobs from './commands/runCronJobs.js';
import * as scaleContainers from './commands/scaleContainers.js';
import * as serve from './commands/serve.js';
import * as start from './commands/start.js';
import * as synchronizeTrainings from './commands/synchronizeTrainings.js';
import { coerceRemote } from './lib/coercers.js';
import { initAxios } from './lib/initAxios.js';

process.title = 'appsemble';

const explorer = cosmiconfig('appsembleServer');
const found = await explorer.search(process.cwd());

let parser = yargs(process.argv.slice(2))
  .version(version)
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
  .option('remote', {
    description: 'The Appsemble host that should be used.',
    default: 'https://appsemble.app',
    coerce: coerceRemote,
  })
  .option('client-credentials', {
    description: `OAuth2 client credentials formatted as "client_id:client_secret". This may also be defined in the ${CREDENTIALS_ENV_VAR} environment variable.`,
  })
  // @ts-expect-error 2322 ... is not assignable to type (strictNullChecks)
  .middleware([configureLogger, initAxios])
  .command(app)
  .command(asset)
  .command(block)
  .command(cleanupResourcesAndAssets as unknown as CommandModule)
  .command(cleanupDemoAppMembers as unknown as CommandModule)
  .command(cleanupSoftDeletedRecords as unknown as CommandModule)
  .command(checkMigrations as unknown as CommandModule)
  .command(checkDownMigrations as unknown as CommandModule)
  .command(fuzzMigrations as unknown as CommandModule)
  .command(config)
  .command(login as unknown as CommandModule)
  .command(logout as unknown as CommandModule)
  .command(migrate as unknown as CommandModule)
  .command(migrateAppDefinitions as unknown as CommandModule)
  .command(organization)
  .command(resource)
  .command(runCronJobs as unknown as CommandModule)
  .command(start as unknown as CommandModule)
  .command(synchronizeTrainings as unknown as CommandModule)
  .command(serve as unknown as CommandModule)
  .command(scaleContainers as unknown as CommandModule)
  .command(group)
  .demandCommand(1)
  // .strict() isn’t used because of https://github.com/yargs/yargs/issues/2058
  .strictCommands()
  .fail(handleError)
  .help()
  .completion();
if (found) {
  parser = parser.config(found.config);
}
parser.parse();
