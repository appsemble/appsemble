import { AppsembleError } from '@appsemble/node-utils';
import semver from 'semver';
import { Argv } from 'yargs';

import { migrations } from '../migrations';
import { initDB } from '../models';
import { Argv as Args } from '../types';
import { migrate } from '../utils/migrate';
import { readPackageJson } from '../utils/readPackageJson';
import { handleDBError } from '../utils/sqlUtils';
import { databaseBuilder } from './builder/database';

export const command = 'migrate [to]';
export const description = 'Migrate the Appsemble database.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs).positional('to', {
    desc: 'The database version to migrate to.',
    default: readPackageJson().version,
  });
}

export async function handler(argv: Args): Promise<void> {
  const { to } = argv;
  if (to !== 'next' && !semver.valid(to)) {
    throw new AppsembleError(`A valid semver is required. Got ${to}`);
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

  await migrate(to, migrations);
  await db.close();
}
