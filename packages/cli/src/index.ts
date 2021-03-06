#!/usr/bin/env node
import { extname, join } from 'path';

import { configureLogger, handleError } from '@appsemble/node-utils';
import { cosmiconfig } from 'cosmiconfig';
import yargs from 'yargs';

import { CREDENTIALS_ENV_VAR } from './lib/authentication';
import { coerceRemote } from './lib/coercers';
import { initAxios } from './lib/initAxios';

export async function main(argv: string[]): Promise<void> {
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
    .commandDir(join(__dirname, 'commands'), {
      extensions: [extname(__filename).slice(1)],
    })
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion();
  if (found) {
    parser = parser.config(found.config);
  }
  parser.parse(argv);
}

if (require.main === module) {
  process.title = 'appsemble';
  main(process.argv.slice(2));
}
