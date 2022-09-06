#!/usr/bin/env node
import process from 'process';

import { configureLogger, handleError } from '@appsemble/node-utils';
import { cosmiconfig } from 'cosmiconfig';
import yargs, { CommandModule } from 'yargs';

import * as app from './commands/app/index.js';
import * as asset from './commands/asset/index.js';
import * as block from './commands/block/index.js';
import * as cleanupResources from './commands/cleanupResources.js';
import * as config from './commands/config/index.js';
import * as login from './commands/login.js';
import * as logout from './commands/logout.js';
import * as migrate from './commands/migrate.js';
import * as organization from './commands/organization/index.js';
import * as resource from './commands/resource/index.js';
import * as runCronJobs from './commands/runCronJobs.js';
import * as start from './commands/start.js';
import * as team from './commands/team/index.js';
import { CREDENTIALS_ENV_VAR } from './lib/authentication.js';
import { coerceRemote } from './lib/coercers.js';
import { initAxios } from './lib/initAxios.js';
import pkg from './package.json' assert { type: 'json' };

process.title = 'appsemble';

const explorer = cosmiconfig('appsembleServer');
const found = await explorer.search(process.cwd());

let parser = yargs(process.argv.slice(2))
  .version(pkg.version)
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
  .middleware([configureLogger, initAxios])
  .command(app)
  .command(asset)
  .command(block)
  .command(cleanupResources as unknown as CommandModule)
  .command(config)
  .command(login as unknown as CommandModule)
  .command(logout as unknown as CommandModule)
  .command(migrate as unknown as CommandModule)
  .command(organization)
  .command(resource)
  .command(runCronJobs as unknown as CommandModule)
  .command(start as unknown as CommandModule)
  .command(team)
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
