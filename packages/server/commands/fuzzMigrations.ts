import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations as appMigrations } from '../migrations/apps/index.js';
import { migrations } from '../migrations/main/index.js';
import { getAppDB } from '../models/index.js';
import { logDBDebugInstructions, migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { setupTestDatabase } from '../utils/test/testSchema.js';

export const command = 'fuzz-migrations';
export const description = 'Fuzz migrations to find inconsistencies';

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

  try {
    for (let index = 0; index < 2; index += 1) {
      await migrate(db, migrations[0].key, migrations);
      await migrate(db, 'next', migrations);
    }
  } catch (error) {
    logDBDebugInstructions(db);
    throw error;
  }

  await db.models.Organization.create({ id: 'appsemble' });
  await db.models.App.create({
    OrganizationId: 'appsemble',
    definition: {},
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });

  try {
    const { sequelize: appDB } = await getAppDB(1);

    logger.info('dropping database');
    await appDB.getQueryInterface().dropAllTables();

    try {
      for (let index = 0; index < 5; index += 1) {
        await migrate(appDB, appMigrations[0].key, appMigrations);
        await migrate(appDB, 'next', appMigrations);
      }
    } catch (error) {
      logDBDebugInstructions(appDB);
      throw error;
    }
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await db.close();
  process.exit();
}
