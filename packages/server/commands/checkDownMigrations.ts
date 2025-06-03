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

export const command = 'check-down-migrations';
export const description =
  'Checks that the down migrations are defined correctly and match when migrating up to the previous migration';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function handler(): Promise<void> {
  let db: Sequelize;

  try {
    [db] = await setupTestDatabase('appsemble_check_down_migrations');
  } catch (error: unknown) {
    handleDBError(error as Error);
  }
  for (const [index, migration] of migrations.entries()) {
    if (index === 0) {
      logger.info(`Not checking down migration for ${migration.key}, because first migration.`);
      continue;
    }
    const fromUp = await apply(db, 'migrations', async () => {
      logger.info(`Applying migrations up to ${migration.key}`);
      await migrate(db, migrations[index - 1].key, migrations);
    });
    const fromDown = await apply(db, 'migrations', async () => {
      logger.info(`Applying migrations up to ${migration.key}`);
      await migrate(db, migration.key, migrations);
      logger.info(`Applying down migration from ${migration.key}`);
      await migrate(db, migrations[index - 1].key, migrations);
    });
    const counts = handleDiff(
      fromUp,
      fromDown,
      `up migrations <= ${migrations[index - 1].key}`,
      `${migration.key} down migration`,
    );
    if (counts.tables + counts.enums > 0) {
      logger.error(
        `Down migration ${migration.key} out of sync with up migration from ${migrations[index - 1].key}`,
      );
      logDBDebugInstructions(db);
      process.exit(1);
    }
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
    for (const [index, migration] of appMigrations.entries()) {
      if (index === 0) {
        logger.info(`Not checking down migration for ${migration.key}, because first migration.`);
        continue;
      }
      const fromUp = await apply(appDB, 'migrations', async () => {
        logger.info(`Applying migrations up to ${migration.key}`);
        await migrate(appDB, appMigrations[index - 1].key, appMigrations);
      });
      const fromDown = await apply(appDB, 'migrations', async () => {
        logger.info(`Applying migrations up to ${migration.key}`);
        await migrate(appDB, migration.key, appMigrations);
        logger.info(`Applying down migration from ${migration.key}`);
        await migrate(appDB, appMigrations[index - 1].key, appMigrations);
      });
      const counts = handleDiff(
        fromUp,
        fromDown,
        `up migrations <= ${appMigrations[index - 1].key}`,
        `${migration.key} down migration`,
      );
      if (counts.tables + counts.enums > 0) {
        logger.error(
          `Down migration ${migration.key} out of sync with up migration from ${appMigrations[index - 1].key}`,
        );
        logDBDebugInstructions(appDB);
        process.exit(1);
      }
    }
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await db.close();
  process.exit();
}
