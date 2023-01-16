import { Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { BaseArguments } from '../types.js';

export const command = 'run-cronjobs';
export const description = 'Runs all cronjobs associated with apps.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('interval', {
      desc: 'How many minutes are between each cron job run.',
      type: 'number',
      default: 5,
    })
    .option('database-host', {
      desc: 'The host of the database to connect to. This defaults to the connected database container.',
    })
    .option('database-port', {
      desc: 'The port of the database to connect to.',
      type: 'number',
      default: 5432,
    })
    .option('database-ssl', {
      desc: 'Use SSL to connect to the database.',
      type: 'boolean',
    })
    .option('database-name', {
      desc: 'The name of the database to connect to.',
      implies: ['database-user', 'database-password'],
    })
    .option('database-user', {
      desc: 'The user to use to login to the database.',
      implies: ['database-name', 'database-password'],
    })
    .option('database-password', {
      desc: 'The password to use to login to the database.',
      implies: ['database-name', 'database-user'],
    })
    .option('database-url', {
      desc: 'A connection string for the database to connect to. This is an alternative to the separate database related variables.',
      conflicts: ['database-host', 'database-name', 'database-user', 'database-password'],
    });
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { runCronJobs, setArgv } = await serverImport('setArgv', 'runCronJobs');
  setArgv(argv);
  return runCronJobs();
}
