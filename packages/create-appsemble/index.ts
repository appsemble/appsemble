#!/usr/bin/env node
import { configureLogger, handleError } from '@appsemble/node-utils';
import yargs, { type CommandModule } from 'yargs';

import * as block from './commands/block.js';
import pkg from './package.json' assert { type: 'json' };

yargs()
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
  .middleware([configureLogger])
  .command(block as unknown as CommandModule)
  .demandCommand(1)
  .fail(handleError)
  .help()
  .completion()
  .parse(process.argv.slice(2));
