import { parse } from 'node:path';

import { Sequelize } from 'sequelize';

import { initDB, type InitDBParams } from '../../models/index.js';

/**
 * Create a temporary test database for each test in a test module or describe block.
 *
 * The database will be truncated after each test. It will be deleted after all tests have run.
 *
 * @param meta The `import.meta` property.
 * @param options Additional sequelize options.
 */
export function useTestDatabase(meta: ImportMeta, options: InitDBParams = {}): void {
  let dbName: string;
  let rootDB: Sequelize;
  let db: Sequelize;

  beforeAll(async () => {
    const database =
      process.env.DATABASE_URL || 'postgres://admin:password@localhost:54321/appsemble';
    rootDB = new Sequelize(database, {
      logging: false,
      retry: { max: 3 },
    });

    dbName = rootDB
      .escape(`appsemble_${parse(meta.url).name}_${new Date().toISOString()}`)
      .replaceAll("'", '')
      .replaceAll(/\W+/g, '_')
      .slice(0, 63)
      .toLowerCase();

    await rootDB.query(`CREATE DATABASE ${dbName}`);
    db = initDB({
      ...options,
      uri: `${database.replace(/\/\w+$/, '')}/${dbName}`,
    });
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
