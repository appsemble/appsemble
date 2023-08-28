#!/usr/bin/env node
import { configureLogger, handleError, version } from '@appsemble/node-utils';
import yargs, { type CommandModule } from 'yargs';

import * as app from './commands/app.js';
import * as block from './commands/block.js';

yargs()
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
  .middleware([configureLogger])
  .command(block as unknown as CommandModule)
  .command(app as unknown as CommandModule)
  .demandCommand(1)
  .fail(handleError)
  .help()
  .completion()
  .parse(process.argv.slice(2));
