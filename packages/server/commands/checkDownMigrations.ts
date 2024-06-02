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

export const command = 'check-down-migrations';
export const description =
  'Checks that the down migrations are defined correctly and match when migrating up to the previous migration';

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
  before: string,
  after: string,
  modelsObj: Record<string, unknown>,
  migrationsObj: Record<string, unknown>,
): number {
  logger.error(`${type}s in ${before} vs ${after} are out of sync`);
  let count = 0;
  for (const thing of Object.keys(modelsObj)) {
    if (!migrationsObj[thing]) {
      logger.error(`${type} "${thing}" is missing from ${before}`);
      count += 1;
      continue;
    }
    if (deepEquals(migrationsObj[thing], modelsObj[thing])) {
      continue;
    }
    count += 1;
    const d = diffString(modelsObj[thing], migrationsObj[thing]);
    logger.error(`${type} ${thing} in ${chalk.red(before)} vs ${chalk.green(after)}:`);
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
      .escape(`appsemble_check_down_migrations_${new Date().toISOString()}`)
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
  for (const [index, migration] of migrations.entries()) {
    if (index === 0) {
      logger.info(`Not checking down migration for ${migration.key}, because first migration.`);
      continue;
    }
    const fromUp = await apply(db, 'migrations', async () => {
      logger.info(`applying migrations up to ${migration.key}`);
      await migrate(migrations[index - 1].key, migrations);
    });
    const fromDown = await apply(db, 'migrations', async () => {
      logger.info(`applying migrations up to ${migration.key}`);
      await migrate(migration.key, migrations);
      logger.info(`applying down migration from ${migration.key}`);
      await migrate(migrations[index - 1].key, migrations);
    });
    const counts = {
      tables: 0,
      enums: 0,
    };
    if (!deepEquals(fromUp.tables, fromDown.tables)) {
      counts.tables += logDiff(
        'table',
        `<= ${migrations[index - 1].key}`,
        `${migration.key} down migration`,
        fromDown.tables,
        fromUp.tables,
      );
    }
    if (!deepEquals(fromUp.enums, fromDown.enums)) {
      counts.enums += logDiff(
        'enum',
        `<= ${migrations[index - 1].key}`,
        `${migration.key} down migration`,
        fromDown.enums,
        fromUp.enums,
      );
    }
    logger.info(`found ${counts.tables} table differences`);
    logger.info(`found ${counts.enums} enum differences`);
    if (counts.tables + counts.enums > 0) {
      logger.error(
        `Down migration ${migration.key} out of sync with migrate up of ${migrations[index - 1].key}`,
      );
      process.exit(1);
    }
  }
  await db.close();
  process.exit();
}
