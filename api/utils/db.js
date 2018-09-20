import { promisify } from 'util';

import { isEmpty, mapValues, memoize } from 'lodash-es';
import mysql from 'mysql';

import Sequelize from 'sequelize';


export const getSequelizePool = memoize(async () => {
  const connectionString = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble';
  const db = new Sequelize(connectionString);

  try {
    await db.authenticate();
    console.log('successfully connected to db');
  } catch (e) {
    console.log(e);
  }


  const Apps = db.define('App', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    definition: { type: Sequelize.JSON, allowNull: false },
  }, {
    tableName: 'App2',
    freezeTableName: true,
    paranoid: true,
  });

  await db.sync();

  const model = await db.model('App').findById(1);
  console.log(model); // returns model with fields that can be retrieved with .get('attribute')

  const model2 = await db.model('App').findById(4);
  console.log(model2); // does not exist, returns null

  const model3 = await db.model('App').find({ where: { definition: { name: 'TestResult' } } });
  console.log(model3); // retrieves first record with name 'TestResult' field in its definition

  const { Op } = Sequelize;
  const model4 = await db.model('App').find({ where: { definition: { id: { [Op.gt]: 2 } } } });
  // equal to:   await db.model('App').find({ where: { 'definition.id': { [Op.gt]: 2 } } });
  console.log(model4);


  return db;
});

export const getPool = memoize(() => {
  const foo = getSequelizePool();

  const pool = mysql.createPool({
    database: process.env.MYSQL_DATABASE || 'appsemble',
    host: process.env.MYSQL_HOST || 'localhost',
    password: process.env.MYSQL_ROOT_PASSWORD || 'password',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
  });

  return {
    end: promisify(pool.end.bind(pool)),
    query: promisify(pool.query.bind(pool)),
  };
});


export function insert(table, object) {
  const pool = getPool();
  const data = mapValues(object, (value) => {
    if (value instanceof Object) {
      return JSON.stringify(value);
    }
    return value;
  });
  return pool.query('INSERT INTO ?? SET ?', [table, data]);
}


export async function select(table, query = null) {
  const pool = getPool();
  const data = mapValues(query, (value) => {
    if (value instanceof Object) {
      return JSON.stringify(value);
    }
    return value;
  });
  return pool.query(`SELECT * FROM ??${isEmpty(query) ? '' : ' WHERE ?'}`, [table, data]);
}


export async function update(table, values, query) {
  const pool = getPool();
  const data = mapValues(values, (value) => {
    if (value instanceof Object) {
      return JSON.stringify(value);
    }
    return value;
  });
  return pool.query('UPDATE ?? SET ? WHERE ?', [table, data, query]);
}
