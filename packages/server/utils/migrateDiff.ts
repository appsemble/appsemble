import { logger } from '@appsemble/node-utils';
import chalk from 'chalk';
import extractPgSchema from 'extract-pg-schema';
import { diffString } from 'json-diff';
import { isEqual as deepEquals } from 'lodash-es';
import { type Sequelize } from 'sequelize';

const { extractSchemas } = extractPgSchema;

interface Schema {
  tables: Record<string, unknown>;
  enums: Record<string, string[]>;
}

export async function apply(db: Sequelize, name: string, fn: () => Promise<void>): Promise<Schema> {
  logger.info('Dropping database');
  await db.getQueryInterface().dropAllTables();
  logger.info(`Creating database using ${name}`);
  await fn();
  logger.info('Taking schema from database');
  const schema = await extractSchemas(
    {
      host: db.config.host,
      port: Number(db.config.port),
      user: db.config.username,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
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
                indices: [] as unknown[],
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
  logger.error(`${type}(s) in ${before} vs ${after} are out of sync`);
  let count = 0;
  for (const thing of Object.keys(modelsObj)) {
    if (!migrationsObj[thing]) {
      logger.error(`${type} "${thing}" is missing from ${after}`);
      count += 1;
      continue;
    }
    if (deepEquals(migrationsObj[thing], modelsObj[thing])) {
      continue;
    }
    count += 1;
    const diff = diffString(modelsObj[thing], migrationsObj[thing]);
    logger.error(`${type} ${thing} in ${chalk.red(before)} vs ${chalk.green(after)}:`);
    logger.error(diff);
  }
  return count;
}

export function handleDiff(
  schemaA: Schema,
  schemaB: Schema,
  before: string,
  after: string,
): { tables: number; enums: number } {
  const counts = {
    tables: 0,
    enums: 0,
  };
  if (!deepEquals(schemaA.tables, schemaB.tables)) {
    counts.tables += logDiff('table', before, after, schemaA.tables, schemaB.tables);
  }
  if (!deepEquals(schemaA.enums, schemaB.enums)) {
    counts.enums += logDiff('enum', before, after, schemaA.enums, schemaB.enums);
  }
  logger.info(`Found ${counts.tables} table differences`);
  logger.info(`Found ${counts.enums} enum differences`);
  return counts;
}
