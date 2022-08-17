import { Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import pkg from '../package.json';
import { BaseArguments } from '../types.js';

export const command = 'migrate [migrate-to]';
export const description = 'Migrate the Appsemble database';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('migrate-to', {
      desc: 'The database version to migrate to.',
      default: pkg.version,
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
  const { migrate, setArgv } = await serverImport('setArgv', 'migrate');
  setArgv(argv);
  return migrate();
}
