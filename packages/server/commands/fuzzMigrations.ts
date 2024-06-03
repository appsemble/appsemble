import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { setupTestDatabase } from '../utils/test/testSchema.js';

export const command = 'fuzz-migrations';
export const description = 'Fuzz migrations to find inconcistencies';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function handler(): Promise<void> {
  let db: Sequelize;

  try {
    [db] = await setupTestDatabase('appsemble_fuzz_migrations');
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  logger.info('dropping database');
  await db.getQueryInterface().dropAllTables();

  for (let index = 0; index < 5; index += 1) {
    await migrate(migrations[0].key, migrations);
    await migrate('next', migrations);
  }

  await db.close();
  process.exit();
}
