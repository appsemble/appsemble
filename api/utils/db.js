import { promisify } from 'util';

import { isEmpty, mapValues, memoize } from 'lodash-es';
import mysql from 'mysql';

import Sequelize from 'sequelize';


export const getSequelizePool = memoize(() => {
  const connectionString = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble';
  const db = new Sequelize(connectionString);

  return db;
});

export const getPool = memoize(() => {
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
