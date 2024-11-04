import { AppsembleError, version } from '@appsemble/node-utils';
import semver from 'semver';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'migrate [migrate-to]';
export const description = 'Migrate the Appsemble database.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs).positional('migrate-to', {
    desc: 'The database version to migrate to.',
    default: version,
  });
}

export async function handler(): Promise<void> {
  const { migrateTo } = argv;
  if (migrateTo !== 'next' && !semver.valid(migrateTo)) {
    throw new AppsembleError(`A valid semver is required. Got ${migrateTo}`);
  }
  let db;
  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await migrate(migrateTo, migrations);
  await db.close();
  process.exit();
}
