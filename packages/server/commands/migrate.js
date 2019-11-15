import { AppsembleError } from '@appsemble/node-utils';
import semver from 'semver';

import migrations from '../migrations';
import pkg from '../package.json';
import migrate from '../utils/migrate';
import setupModels, { handleDbException } from '../utils/setupModels';
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
  if (!semver.valid(to)) {
    throw new AppsembleError(`A valid semver is required. Got ${to}`);
  }
  let db;
  try {
    db = await setupModels({
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
    handleDbException(dbException);
  }

  await migrate(db, to, migrations);
  await db.close();
}
