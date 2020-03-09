import Sequelize from 'sequelize';

import setupModels from '../setupModels';

/**
 * Create a temporary test database.
 *
 * The database will be deleted when it is closed.
 *
 * @param {string} spec The name of the test case.
 * @param {Object} options Additional sequelize options.
 */
export default async function testSchema(spec, options = {}) {
  const database = process.env.DATABASE_URL || 'postgres://admin:password@localhost:5432/appsemble';
  const root = new Sequelize(database, {
    logging: false,
    retry: { max: 3 },
  });

  const dbName = root
    .escape(`appsemble_test_${spec}_${new Date().toISOString()}`)
    .replace(/'/g, '')
    .replace(/\W+/g, '_')
    .substring(0, 63)
    .toLowerCase();

  await root.query(`CREATE DATABASE ${dbName}`);
  const db = await setupModels({
    ...options,
    uri: `${database.replace(/\/\w+$/, '')}/${dbName}`,
  });
  await db.sync();

  // Stub db.close(), so also the test database is dropped and the root database connection is
  // closed.
  const { close } = db;
  db.close = async (...args) => {
    await close.apply(db, args);
    await root.query(`DROP DATABASE ${dbName}`);
    await root.close();
  };

  return db;
}
