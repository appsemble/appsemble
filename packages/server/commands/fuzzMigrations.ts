import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { setupTestDatabase } from '../utils/test/testSchema.js';

export const command = 'fuzz-migrations';
export const description = 'Fuzz migrations to find inconsistencies';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function handler(): Promise<void> {
  let db: Sequelize;
  let dbName: string;

  try {
    [db, dbName] = await setupTestDatabase('appsemble_fuzz_migrations');
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  logger.info('dropping database');
  await db.getQueryInterface().dropAllTables();

  try {
    for (let index = 0; index < 5; index += 1) {
      await migrate(migrations[0].key, migrations);
      await migrate('next', migrations);
    }
  } catch (error) {
    logger.info(`Use the following command to connect to the test database for further debugging:

psql postgres://admin:password@localhost:54321/${dbName}`);
    throw error;
  }

  await db.close();
  process.exit();
}
