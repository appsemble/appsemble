import { type Argv } from 'yargs';

import { type ServeArguments } from './serve.js';
import { serverImport } from '../lib/serverImport.js';

export const command = 'synchronize-trainings';
export const description =
  'Checks the training folder for training documents and makes sure they are synchronized with the database';

export function builder(yargs: Argv): Argv<any> {
  return yargs
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

export async function handler(argv: ServeArguments): Promise<void> {
  const { setArgv, synchronizeTrainings } = await serverImport('setArgv', 'synchronizeTrainings');

  setArgv(argv);
  return synchronizeTrainings();
}
