#!/usr/bin/env node
import { configureLogger, handleError } from '@appsemble/node-utils';
import yargs from 'yargs';

import * as block from './commands/block.js';

yargs
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
  .command(block)
  .demandCommand(1)
  .fail(handleError)
  .help()
  .completion()
  .parse(process.argv.slice(2));
