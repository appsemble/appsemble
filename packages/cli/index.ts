#!/usr/bin/env node
import { configureLogger, handleError } from '@appsemble/node-utils';
import { cosmiconfig } from 'cosmiconfig';
import yargs from 'yargs';

import * as app from './commands/app';
import * as asset from './commands/asset';
import * as block from './commands/block';
import * as cleanupResources from './commands/cleanupResources';
import * as config from './commands/config';
import * as login from './commands/login';
import * as logout from './commands/logout';
import * as migrate from './commands/migrate';
import * as organization from './commands/organization';
import * as resource from './commands/resource';
import * as runCronJobs from './commands/runCronJobs';
import * as start from './commands/start';
import * as team from './commands/team';
import { CREDENTIALS_ENV_VAR } from './lib/authentication';
import { coerceRemote } from './lib/coercers';
import { initAxios } from './lib/initAxios';

process.title = 'appsemble';

async function main(argv: string[]): Promise<void> {
  const explorer = cosmiconfig('appsembleServer');
  const found = await explorer.search(process.cwd());

  let parser = yargs
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
    .command(cleanupResources)
    .command(config)
    .command(login)
    .command(logout)
    .command(migrate)
    .command(organization)
    .command(resource)
    .command(runCronJobs)
    .command(start)
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
  parser.parse(argv);
}

main(process.argv.slice(2));
