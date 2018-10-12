import Sequelize from 'sequelize';
import SqlString from 'sequelize/lib/sql-string';
import uuid from 'uuid/v4';

import setupModels from '../setupModels';

export default async function testSchema() {
  const database = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306';
  const root = new Sequelize(database, {
    logging: false,
    // XXX: This removes a pesky sequelize warning. Remove this when updating to sequelize@^5.
    operatorsAliases: Sequelize.Op.Aliases,
  });

  const dbName = SqlString.escape(`appsemble-test-${uuid()}`)
    .replace(/'/g, '')
    .replace(/-/g, '_');

  await root.query(`CREATE SCHEMA IF NOT EXISTS ${dbName}`);
  const db = await setupModels({ sync: true, uri: `${database}/${dbName}` });

  return {
    ...db,
    async close() {
      await db.sequelize.close();

      await root.query(`DROP SCHEMA IF EXISTS ${dbName}`);
      await root.close();
    },
  };
}
