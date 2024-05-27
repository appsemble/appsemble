import { logger } from '@appsemble/node-utils';
import { Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { initDB } from '../models/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'fuzz-migrations';
export const description = 'Fuzz migrations to find inconcistencies';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function handler(): Promise<void> {
  let db: Sequelize;

  try {
    const database =
      process.env.DATABASE_URL || 'postgres://admin:password@localhost:54321/appsemble';
    const rootDB = new Sequelize(database, {
      logging: false,
      retry: { max: 3 },
    });

    const dbName = rootDB
      .escape(`appsemble_fuzz_migrations_${new Date().toISOString()}`)
      .replaceAll("'", '')
      .replaceAll(/\W+/g, '_')
      .slice(0, 63)
      .toLowerCase();

    await rootDB.query(`CREATE DATABASE ${dbName}`);
    db = initDB({
      uri: `${database.replace(/\/\w+$/, '')}/${dbName}`,
    });
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
