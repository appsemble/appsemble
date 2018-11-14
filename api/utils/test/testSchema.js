import Sequelize from 'sequelize';

import setupModels from '../setupModels';

export default async function testSchema(spec) {
  const database = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306';
  const root = new Sequelize(database, {
    logging: false,
    // XXX: This removes a pesky sequelize warning. Remove this when updating to sequelize@^5.
    operatorsAliases: Sequelize.Op.Aliases,
  });

  const dbName = root
    .escape(`appsemble_test_${spec}_${new Date().toISOString()}`)
    .replace(/'/g, '')
    .replace(/\W+/g, '_');

  await root.query(`CREATE DATABASE ${dbName}`);
  const db = await setupModels({
    sync: true,
    uri: `${database.replace(/\/\w+$/, '')}/${dbName}`,
  });

  return {
    ...db,
    async close() {
      await db.close();

      await root.query(`DROP DATABASE ${dbName}`);
      await root.close();
    },
  };
}
