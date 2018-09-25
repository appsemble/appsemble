import setupModels from '../utils/setupModels';

const db = setupModels(true);

/**
 * Koa middleware for setting up the Sequelize models.
 */
export default async function sequelize(ctx, next) {
  ctx.state.db = db;
  await next();
}
