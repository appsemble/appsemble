import { logger } from '@appsemble/node-utils';
import { diffString } from 'json-diff';
import { isEqual as deepEquals } from 'lodash-es';
import { gte as semverGte } from 'semver';
import { Sequelize } from 'sequelize';
import { SequelizeAuto } from 'sequelize-auto';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { migrations } from '../migrations/index.js';
import { initDB } from '../models/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';

const firstDeterministicMigration = '0.23.11';

export const command = 'check-migrations';
export const description =
  'Checks that migrations are defined correctly and match what is defined by models';

interface Schema {
  tables: Record<string, unknown>;
  foreignKeys: Record<string, unknown>;
  hasTriggerTables: Record<string, unknown>;
  relations: unknown[];
  indexes: Record<string, unknown>;
}

async function apply(db: Sequelize, name: string, fn: () => Promise<void>): Promise<Schema> {
  logger.info('dropping database');
  await db.getQueryInterface().dropAllTables();
  logger.info(`creating database using ${name}`);
  await fn();
  logger.info('taking schema from database');
  const auto = new SequelizeAuto(db, null, null, {
    dialect: 'postgres',
    directory: undefined,
    singularize: true,
    useDefine: false,
    closeConnectionAutomatically: false,
  });
  const fullSchema = await auto.run();
  const schema = {
    tables: Object.fromEntries(
      Object.entries(fullSchema.tables).map(([tName, table]) => [
        tName,
        Object.fromEntries(
          Object.entries(table).map(([cName, column]) => [
            cName,
            {
              ...column,
              // XXX: these two issues:
              // https://github.com/sequelize/sequelize-typescript/issues/1704 - Unique annotation
              // name ignored
              // https://github.com/sequelize/sequelize-typescript/issues/1015 - Constraints on
              // table/field
              // make it difficult to check for foreign keys.
              foreignKey: undefined,
              special: [...column.special].sort(),
            },
          ]),
        ),
      ]),
    ),
    // XXX: these two issues:
    // https://github.com/sequelize/sequelize-typescript/issues/1704 - Unique annotation
    // name ignored
    // https://github.com/sequelize/sequelize-typescript/issues/1015 - Constraints on
    // table/field
    // make it difficult to check for foreign keys.
    // foreignKeys: fullSchema.foreignKeys,
    foreignKeys: {},
    hasTriggerTables: fullSchema.hasTriggerTables,
    relations: fullSchema.relations,
    indexes: fullSchema.indexes,
  };
  return schema;
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
    logger.error(`${type} ${thing} in models vs migrations:`);
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
    logger.info(`applying and checking migrations above ${firstDeterministicMigration}`);
    const migrationsToCheck = migrations.filter((m) =>
      semverGte(m.key, firstDeterministicMigration),
    );
    await migrate('next', migrationsToCheck);
  });
  const fromModels = await apply(db, 'models', async () => {
    logger.info('syncing models with database');
    await db.sync();
  });
  const counts = {
    tables: 0,
    foreignKeys: 0,
    hasTriggerTables: 0,
    relations: 0,
  };
  if (!deepEquals(fromMigrations.tables, fromModels.tables)) {
    counts.tables += logDiff('table', fromModels.tables, fromMigrations.tables);
  }
  if (!deepEquals(fromMigrations.foreignKeys, fromModels.foreignKeys)) {
    counts.foreignKeys += logDiff('foreignKey', fromModels.foreignKeys, fromMigrations.foreignKeys);
  }
  if (!deepEquals(fromMigrations.hasTriggerTables, fromModels.hasTriggerTables)) {
    counts.hasTriggerTables += logDiff(
      'hasTriggerTable',
      fromModels.hasTriggerTables,
      fromMigrations.hasTriggerTables,
    );
  }
  if (!deepEquals(fromMigrations.relations, fromModels.relations)) {
    const modelRelationsObj = Object.fromEntries(
      fromModels.relations.map((r: any) => [`${r.parentModel}_${r.childModel}_${r.parentId}`, r]),
    );
    const migrationsRelationsObj = Object.fromEntries(
      fromMigrations.relations.map((r: any) => [
        `${r.parentModel}_${r.childModel}_${r.parentId}`,
        r,
      ]),
    );
    counts.relations += logDiff('relation', modelRelationsObj, migrationsRelationsObj);
  }
  logger.info(`found ${counts.tables} table differences`);
  logger.info(`found ${counts.foreignKeys} foreignKey differences`);
  logger.info(`found ${counts.hasTriggerTables} hasTriggerTable differences`);
  logger.info(`found ${counts.relations} relation differences`);
  await db.close();
  if (counts.tables + counts.foreignKeys + counts.hasTriggerTables + counts.relations > 0) {
    logger.error('models and migrations are out of sync');
    process.exit(1);
  }
  process.exit();
}
