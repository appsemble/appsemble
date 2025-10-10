import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'restore-data-from-backup';
export const description =
  'Restore appsemble data from a specified backup for the main database and app databases';

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
    })
    .option('appsembleBackupFile', {
      type: 'string',
      describe:
        'The appsemble backup file to restore data from, e.g., appsemble_prod_backup_20250101.sql.gz',
      demandOption: true,
    });
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { restoreDataFromBackup, setArgv } = await serverImport('setArgv', 'restoreDataFromBackup');
  setArgv(argv);
  return restoreDataFromBackup();
}
