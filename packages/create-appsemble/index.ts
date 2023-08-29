#!/usr/bin/env node
import { configureLogger, handleError, version } from '@appsemble/node-utils';
import yargs from 'yargs';

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
  .demandCommand(1)
  .fail(handleError)
  .help()
  .completion()
  .parse(process.argv.slice(2));
