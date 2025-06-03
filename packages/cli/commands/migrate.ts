import { version } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'migrate [migrate-to]';
export const description = 'Migrate the Appsemble database';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('migrate-to', {
      desc: 'The database version to migrate to.',
      default: version,
    })
    .option('database-host', {
      desc: 'The host of the database to connect to. This defaults to the connected database container.',
    })
    .option('database-port', {
      desc: 'The port of the database to connect to.',
      type: 'number',
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
    .option('s3-host', {
      desc: 'The host of the Amazon S3 compatible object storage server',
    })
    .option('s3-port', {
      desc: 'The port of the Amazon S3 compatible object storage server',
      type: 'number',
      default: 9000,
    })
    .option('s3-secure', {
      desc: 'Whether ssl should be used for the Amazon S3 compatible object storage server',
      type: 'boolean',
      default: true,
    })
    .option('s3-access-key', {
      desc: 'The access key of the Amazon S3 compatible object storage server',
    })
    .option('s3-secret-key', {
      desc: 'The secret key of the Amazon S3 compatible object storage server',
    });
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { migrate, setArgv } = await serverImport('setArgv', 'migrate');
  setArgv(argv);
  return migrate();
}
