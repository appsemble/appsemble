import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { migrate } from '../utils/migrate.js';
import { apply, handleDiff } from '../utils/migrateDiff.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { setupTestDatabase } from '../utils/test/testSchema.js';

export const command = 'check-migrations';
export const description =
  'Checks that migrations are defined correctly and match what is defined by models';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function handler(): Promise<void> {
  let db: Sequelize;
  let dbName: string;

  try {
    [db, dbName] = await setupTestDatabase('appsemble_check_migrations');
  } catch (error: unknown) {
    handleDBError(error as Error);
  }
  const fromMigrations = await apply(db, 'migrations', async () => {
    logger.info(`Applying migrations from ${migrations[0].key} to latest`);
    await migrate('next', migrations);
  });
  const fromModels = await apply(db, 'models', async () => {
    logger.info('Syncing models with database');
    await db.sync();
  });
  const counts = handleDiff(fromMigrations, fromModels, 'migrations', 'models');
  await db.close();
  if (counts.tables + counts.enums > 0) {
    logger.error('Models and migrations are out of sync');
    logger.info(`Use the following command to connect to the test database for further debugging:

psql postgres://admin:password@localhost:54321/${dbName}`);
    process.exit(1);
  }
  process.exit();
}
