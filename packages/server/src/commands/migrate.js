import { AppsembleError } from '@appsemble/node-utils';
import semver from 'semver';

import pkg from '../../package.json';
import migrations from '../migrations';
import { initDB } from '../models';
import migrate from '../utils/migrate';
import { handleDBError } from '../utils/sqlUtils';
import databaseBuilder from './builder/database';

export const command = 'migrate [to]';
export const description = 'Migrate the Appsemble database.';

export function builder(yargs) {
  return databaseBuilder(yargs).positional('to', {
    desc: 'The database version to migrate to.',
    default: pkg.version,
  });
}

export async function handler(argv) {
  const { to } = argv;
  if (to !== 'next' && !semver.valid(to)) {
    throw new AppsembleError(`A valid semver is required. Got ${to}`);
  }
  let db;
  try {
    db = initDB({
      sync: false,
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (dbException) {
    handleDBError(dbException);
  }

  await migrate(to, migrations);
  await db.close();
}
