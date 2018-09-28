import sequelizeMiddleware from './sequelize';

describe('sequelizeMiddleware', () => {
  it('should include the database in ctx', async () => {
    const ctx = { state: {} };

    const mockNext = jest.fn(() => {
      expect(ctx.state.db).toBeDefined();
      expect(ctx.state.db.sequelize).toBeDefined();
      expect(ctx.state.db.Sequelize).toBeDefined();
    });

    await sequelizeMiddleware(ctx, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
