import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations as appMigrations } from '../migrations/apps/index.js';
import { migrations } from '../migrations/main/index.js';
import { getAppDB } from '../models/index.js';
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
    for (let index = 0; index < 2; index += 1) {
      await migrate(db, migrations[0].key, migrations);
      await migrate(db, 'next', migrations);
    }
  } catch (error) {
    logger.info(`Use the following command to connect to the test database for further debugging:

psql postgres://admin:password@localhost:54321/${dbName}`);
    throw error;
  }

  await db.query(
    'INSERT INTO "Organization" ("id", "created", "updated") VALUES (\'appsemble\', NOW(), NOW())',
  );
  await db.query(
    'INSERT INTO "App" ("id", "definition", "vapidPublicKey", "vapidPrivateKey", "OrganizationId", "created", "updated") VALUES (1, \'{}\', \'\', \'\', \'appsemble\', NOW(), NOW())',
  );

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
      logger.info(`Use the following command to connect to the test database for further debugging:

psql postgres://admin:password@localhost:54321/${appDB.getDatabaseName()}`);
      throw error;
    }
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await db.close();
  process.exit();
}
