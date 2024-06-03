import { parse } from 'node:path';

import { Sequelize } from 'sequelize';

import { initDB, type InitDBParams } from '../../models/index.js';

export async function setupTestDatabase(
  name: string,
  options: InitDBParams = {},
): Promise<[db: Sequelize, dbName: string, rootDB: Sequelize]> {
  const connection =
    process.env.DATABASE_URL || 'postgres://admin:password@localhost:54321/appsemble';
  const rootDB = new Sequelize(connection, {
    logging: false,
    retry: { max: 3 },
  });

  const dbName = rootDB
    .escape(`${name}_${new Date().toISOString()}`)
    .replaceAll("'", '')
    .replaceAll(/\W+/g, '_')
    .slice(0, 63)
    .toLowerCase();

  await rootDB.query(`CREATE DATABASE ${dbName}`);
  const db = initDB({
    ...options,
    uri: `${connection.replace(/\/\w+$/, '')}/${dbName}`,
  });
  return [db, dbName, rootDB];
}

function createTestDatabase(
  meta: ImportMeta,
  beforeAll: typeof import('vitest').beforeAll,
  afterEach: typeof import('vitest').afterEach,
  afterAll: typeof import('vitest').afterAll,
  options: InitDBParams = {},
): void {
  let dbName: string;
  let rootDB: Sequelize;
  let db: Sequelize;

  beforeAll(async () => {
    [db, dbName, rootDB] = await setupTestDatabase(`appsemble_${parse(meta.url).name}`, options);
    await db.sync();
  });

  afterEach(async () => {
    if (db) {
      const tables = Object.values(db.models).map(({ tableName }) => `"${tableName}"`);
      await db.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY`);
    }
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
    if (rootDB) {
      await rootDB.query(`DROP DATABASE ${dbName}`);
      await rootDB.close();
    }
  });
}

/**
 * Create a temporary test database for each test in a test module or describe block.
 *
 * The database will be truncated after each test. It will be deleted after all tests have run.
 *
 * @param meta The `import.meta` property.
 * @param options Additional sequelize options.
 */
export function useTestDatabase(meta: ImportMeta, options: InitDBParams = {}): void {
  if (process.env.NODE_ENV !== 'test') {
    return;
  }
  import('vitest').then(({ afterAll, afterEach, beforeAll }) =>
    createTestDatabase(meta, beforeAll, afterEach, afterAll, options),
  );
}
