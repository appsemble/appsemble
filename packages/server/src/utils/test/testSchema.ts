import { Sequelize } from 'sequelize';

import { getDB, initDB, InitDBParams } from '../../models';

let dbName: string;
let rootDB: Sequelize;

/**
 * Create a temporary test database.
 *
 * The database will be deleted when it is closed.
 *
 * @example
 * ```ts
 * beforeAll(createTestSchema('testfile'));
 *
 * afterEach(truncate);
 *
 * afterAll(closeTestSchema);
 * ```
 *
 * @param spec - The name of the test case.
 * @param options - Additional sequelize options.
 *
 * @returns A function to pass into `beforeAll()`.
 */
export function createTestSchema(spec: string, options: InitDBParams = {}): () => Promise<void> {
  return async () => {
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
    const db = initDB({
      ...options,
      uri: `${database.replace(/\/\w+$/, '')}/${dbName}`,
    });
    await db.sync();
  };
}

/**
 * Close the created test schema.
 */
export async function closeTestSchema(): Promise<void> {
  const db = getDB();
  await db.close();
  await rootDB.query(`DROP DATABASE ${dbName}`);
  await rootDB.close();
}

/**
 * Truncate the entire database and reset id generators.
 *
 * This is ~50% faster than `db.truncate()` and resets id generators.
 */
export async function truncate(): Promise<void> {
  const db = getDB();
  const tables = Object.values(db.models).map(({ tableName }) => `"${tableName}"`);
  await db.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY`);
}
