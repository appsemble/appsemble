import { configureLogger, handleError } from '@appsemble/node-utils';
import path from 'path';
import yargs from 'yargs';

declare global {
  /**
   * This allows us to use puppeteer types without using the `dom` lib.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Element {}
}

function main(): void {
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
    .commandDir(path.join(__dirname, 'commands'), { extensions: ['ts'] })
    .demandCommand(1)
    .fail(handleError)
    .help()
    .completion()
    .parse(process.argv.slice(2));
}

if (require.main === module) {
  main();
}
