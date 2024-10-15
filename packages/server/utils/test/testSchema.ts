import { createHash } from 'node:crypto';

import { Sequelize } from 'sequelize';

import { initDB, type InitDBParams } from '../../models/index.js';

const CONNECTION =
  process.env.DATABASE_URL || 'postgres://admin:password@localhost:54321/appsemble';

const rootDB = new Sequelize(CONNECTION, {
  logging: false,
  retry: { max: 3 },
});

export function getTestNameHash(name: string): string {
  return createHash('sha256').update(name).digest('hex').slice(0, 10);
}

function getUniqueName(name: string): string {
  return rootDB
    .escape(`test_${name}_${new Date().toISOString()}`)
    .replaceAll("'", '')
    .replaceAll(/\W+/g, '_')
    .slice(0, 63)
    .toLowerCase();
}

export async function setupTestDatabase(
  name: string,
  options: InitDBParams = {},
): Promise<[db: Sequelize, dbName: string, rootDB: Sequelize]> {
  const dbName = getUniqueName(name);

  await rootDB.query(`CREATE DATABASE ${dbName}`);

  const db = initDB({
    ...options,
    uri: `${CONNECTION.replace(/\/\w+$/, '')}/${dbName}`,
  });

  // We are overwriting the default behavior of sequelize for creating tables
  // We want to use PostgreSQL's UNLOGGED tables feature to improve performance in tests
  // The sequelize library does not provide an interface for the queryGenerator

  const { queryGenerator } = db.getQueryInterface() as {
    queryGenerator: {
      createTableQuery: (
        tableName: string,
        attributes: string[],
        options: Record<string, any>,
      ) => string;
    };
  };

  const originalCreateTableQuery = queryGenerator.createTableQuery;

  // eslint-disable-next-line func-names
  queryGenerator.createTableQuery = function (tableName, attributes, opts) {
    const tableQuery = originalCreateTableQuery.call(this, tableName, attributes, opts);
    return tableQuery.replace('CREATE TABLE', 'CREATE UNLOGGED TABLE');
  };

  return [db, dbName, rootDB];
}
