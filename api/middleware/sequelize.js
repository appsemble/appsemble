import Sequelize from 'sequelize';

import setupModels from '../utils/setupModels';

export function getSequelizePool() {
  const connectionString = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble';
  const db = new Sequelize(connectionString, { logging: false });

  return db;
}

const db = setupModels(true);

/**
 * Koa middleware for setting up the Sequelize models.
 */
export default async function sequelize(ctx, next) {
  ctx.state.db = db;
  await next();
}
