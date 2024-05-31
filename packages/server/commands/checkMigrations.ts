import { logger } from '@appsemble/node-utils';
import chalk from 'chalk';
import extractPgSchema from 'extract-pg-schema';
import { diffString } from 'json-diff';
import { isEqual as deepEquals } from 'lodash-es';
import { Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { initDB } from '../models/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';

const { extractSchemas } = extractPgSchema;

export const command = 'check-migrations';
export const description =
  'Checks that migrations are defined correctly and match what is defined by models';

interface Schema {
  tables: Record<string, unknown>;
  enums: Record<string, string[]>;
}

async function apply(db: Sequelize, name: string, fn: () => Promise<void>): Promise<Schema> {
  logger.info('dropping database');
  await db.getQueryInterface().dropAllTables();
  logger.info(`creating database using ${name}`);
  await fn();
  logger.info('taking schema from database');
  const schema = await extractSchemas(
    {
      host: db.config.host,
      port: Number(db.config.port),
      user: db.config.username,
      password: db.config.password,
      database: db.config.database,
    },
    {},
  );
  const result: Schema = {
    tables: Object.fromEntries(
      schema.public.tables.map((table) => [
        table.name,
        {
          ...table,
          indices: Object.fromEntries(
            table.indices.map((index) => [
              index.name,
              {
                ...index,
                columns: Object.fromEntries(index.columns.map((column) => [column.name, column])),
              },
            ]),
          ),
          columns: Object.fromEntries(
            table.columns.map((column) => [
              column.name,
              {
                ...column,
                // Position in table schema irrelevant
                ordinalPosition: 0,
                // Again contains ordinal positions
                informationSchemaValue: {},
                // Ingore already present on table under indices
                indices: [],
              },
            ]),
          ),
        },
      ]),
    ),
    enums: Object.fromEntries(schema.public.enums.map((e) => [e.name, [...e.values].sort()])),
  };
  return result;
}

function logDiff(
  type: string,
  modelsObj: Record<string, unknown>,
  migrationsObj: Record<string, unknown>,
): number {
  logger.error(`${type}s in models vs migrations are out of sync`);
  let count = 0;
  for (const thing of Object.keys(modelsObj)) {
    if (!migrationsObj[thing]) {
      logger.error(`${type} "${thing}" is missing from migrations`);
      count += 1;
      continue;
    }
    if (deepEquals(migrationsObj[thing], modelsObj[thing])) {
      continue;
    }
    count += 1;
    const d = diffString(modelsObj[thing], migrationsObj[thing]);
    logger.error(`${type} ${thing} in ${chalk.red('models')} vs ${chalk.green('migrations')}:`);
    logger.error(d);
  }
  return count;
}

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
      .escape(`appsemble_check_migrations_${new Date().toISOString()}`)
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
  const fromMigrations = await apply(db, 'migrations', async () => {
    logger.info(`applying migrations from ${migrations[0].key} to latest`);
    await migrate('next', migrations);
  });
  const fromModels = await apply(db, 'models', async () => {
    logger.info('syncing models with database');
    await db.sync();
  });
  const counts = {
    tables: 0,
    enums: 0,
  };
  if (!deepEquals(fromMigrations.tables, fromModels.tables)) {
    counts.tables += logDiff('table', fromModels.tables, fromMigrations.tables);
  }
  if (!deepEquals(fromMigrations.enums, fromModels.enums)) {
    counts.enums += logDiff('enum', fromModels.enums, fromMigrations.enums);
  }
  logger.info(`found ${counts.tables} table differences`);
  logger.info(`found ${counts.enums} enum differences`);
  await db.close();
  if (counts.tables + counts.enums > 0) {
    logger.error('models and migrations are out of sync');
    process.exit(1);
  }
  process.exit();
}
