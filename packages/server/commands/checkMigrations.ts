import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations as appMigrations } from '../migrations/apps/index.js';
import { migrations } from '../migrations/main/index.js';
import { getAppDB } from '../models/index.js';
import { logDBDebugInstructions, migrate } from '../utils/migrate.js';
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

  try {
    [db] = await setupTestDatabase('appsemble_check_migrations');
  } catch (error: unknown) {
    handleDBError(error as Error);
  }
  const fromMigrations = await apply(db, 'migrations', async () => {
    logger.info(`Applying migrations from ${migrations[0].key} to latest`);
    await migrate(db, 'next', migrations);
  });
  const fromModels = await apply(db, 'models', async () => {
    logger.info('Syncing models with database');
    await db.sync();
  });
  const counts = handleDiff(fromMigrations, fromModels, 'migrations', 'models');

  if (counts.tables + counts.enums > 0) {
    logger.error('Models and migrations are out of sync');
    logDBDebugInstructions(db);
    process.exit(1);
  }

  await db.query(
    'INSERT INTO "Organization" ("id", "created", "updated") VALUES (\'appsemble\', NOW(), NOW())',
  );
  await db.query(
    'INSERT INTO "App" ("id", "definition", "vapidPublicKey", "vapidPrivateKey", "OrganizationId", "created", "updated") VALUES (1, \'{}\', \'\', \'\', \'appsemble\', NOW(), NOW())',
  );

  try {
    const { sequelize: appDB } = await getAppDB(1);
    const fromAppMigrations = await apply(appDB, 'migrations', async () => {
      logger.info(`Applying migrations from ${appMigrations[0].key} to latest`);
      await migrate(appDB, 'next', appMigrations);
    });
    const fromAppModels = await apply(appDB, 'models', async () => {
      logger.info('Syncing models with database');
      await appDB.sync();
    });
    const appCounts = handleDiff(fromAppMigrations, fromAppModels, 'migrations', 'models');
    if (appCounts.tables + appCounts.enums > 0) {
      logger.error('Models and migrations are out of sync');
      logDBDebugInstructions(appDB);
      process.exit(1);
    }
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await db.close();
  process.exit();
}
