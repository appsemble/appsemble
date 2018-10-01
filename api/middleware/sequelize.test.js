import sequelizeMiddleware from './sequelize';

describe('sequelizeMiddleware', () => {
  it('should include the database in ctx', async () => {
    const ctx = { state: {} };

    const mockNext = jest.fn();

    await sequelizeMiddleware(ctx, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    expect(ctx.state.db).toBeDefined();
    expect(ctx.state.db.sequelize).toBeDefined();
    expect(ctx.state.db.Sequelize).toBeDefined();

    await ctx.state.db.sequelize.close();
  });
});
