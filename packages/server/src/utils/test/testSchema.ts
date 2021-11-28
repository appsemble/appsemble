import { Sequelize } from 'sequelize';

import { initDB, InitDBParams } from '../../models';

/**
 * Create a temporary test database for each test in a test module or describe block.
 *
 * The database will be truncated after each test. It will be deleted after all tests have run.
 *
 * @param spec - The name of the test case.
 * @param options - Additional sequelize options.
 */
export function useTestDatabase(spec: string, options: InitDBParams = {}): void {
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

    // eslint-disable-next-line unicorn/prefer-string-slice
    dbName = rootDB
      .escape(`appsemble_test_${spec}_${new Date().toISOString()}`)
      .replace(/'/g, '')
      .replace(/\W+/g, '_')
      .substr(0, 63)
      .toLowerCase();

    await rootDB.query(`CREATE DATABASE ${dbName}`);
    db = initDB({
      ...options,
      uri: `${database.replace(/\/\w+$/, '')}/${dbName}`,
    });
    await db.sync();
  });

  afterEach(async () => {
    const tables = Object.values(db.models).map(({ tableName }) => `"${tableName}"`);
    await db.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY`);
  });

  afterAll(async () => {
    await db.close();
    await rootDB.query(`DROP DATABASE ${dbName}`);
    await rootDB.close();
  });
}
