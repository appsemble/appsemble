import { logger } from '@appsemble/node-utils';
import { Sequelize } from 'sequelize';

import { initDB, type InitDBParams } from '../../models/index.js';
import { argv } from '../argv.js';

function getConnection(): string {
  return `postgres://${argv.databaseUser || process.env.DATABASE_USER || 'admin'}:${argv.databasePassword || process.env.DATABASE_PASSWORD || 'password'}@${argv.databaseHost || process.env.DATABASE_HOST || 'localhost'}:${argv.databasePort || process.env.DATABASE_PORT || 54_321}/${argv.databaseName || process.env.DATABASE_NAME || 'appsemble'}`;
}

export function getRootDB(): Sequelize {
  return new Sequelize(getConnection(), {
    logging: false,
    retry: { max: 3 },
  });
}

function getUniqueName(name: string): string {
  return getRootDB()
    .escape(`test_${name}_${new Date().toISOString()}`)
    .replaceAll("'", '')
    .replaceAll(/\W+/g, '_')
    .slice(0, 63)
    .toLowerCase();
}

export async function setupTestDatabase(
  name: string,
  options: InitDBParams = {},
): Promise<[db: Sequelize, dbName: string]> {
  const dbName = getUniqueName(name);

  await getRootDB().query(`CREATE DATABASE ${dbName}`);

  const db = initDB({
    ...options,
    uri: `${getConnection().replace(/\/\w+$/, '')}/${dbName}`,
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

  return [db, dbName];
}

export async function createTestDBWithUser({
  dbName,
  dbPassword,
  dbUser,
}: {
  dbName: string;
  dbPassword: string;
  dbUser: string;
}): Promise<{ dbName: string; dbHost: string; dbPort: number; dbUser: string } | null> {
  try {
    const rootDB = getRootDB();

    const escapedDBUser = getUniqueName(dbUser);
    await rootDB.query(`CREATE USER "${escapedDBUser}" WITH PASSWORD '${dbPassword}'`);

    const escapedDBName = getUniqueName(dbName);
    const [[{ exists }]] = (await rootDB.query(
      `SELECT EXISTS (SELECT FROM pg_database WHERE datname = '${escapedDBName}');`,
    )) as { exists: boolean }[][];

    if (!exists) {
      await rootDB.query(`CREATE DATABASE "${escapedDBName}" OWNER "${escapedDBUser}"`);
    }
    logger.info(`Database "${escapedDBName}" created with user "${escapedDBUser}"`);

    return {
      dbName: escapedDBName,
      dbHost: rootDB.config.host!,
      dbPort: Number(rootDB.config.port!),
      dbUser: escapedDBUser,
    };
  } catch (error) {
    logger.error('Error:', error);
  }
  return null;
}
