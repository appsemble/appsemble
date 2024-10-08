import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { migrate } from '../utils/migrate.js';
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
  let dbName: string;

  try {
    [db, dbName] = await setupTestDatabase('appsemble_check_down_migrations');
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
      await migrate(migrations[index - 1].key, migrations);
    });
    const fromDown = await apply(db, 'migrations', async () => {
      logger.info(`Applying migrations up to ${migration.key}`);
      await migrate(migration.key, migrations);
      logger.info(`Applying down migration from ${migration.key}`);
      await migrate(migrations[index - 1].key, migrations);
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
      logger.info(`For further debugging use the following command, to connect to the database:

  psql postgres://admin:password@localhost:54321/${dbName}`);
      process.exit(1);
    }
  }
  await db.close();
  process.exit();
}
