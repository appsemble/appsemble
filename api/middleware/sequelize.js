/**
 * Koa middleware for setting up the Sequelize models.
 */
export default function sequelize(db) {
  return async (ctx, next) => {
    ctx.state.db = await db;
    await next();
  };
}
