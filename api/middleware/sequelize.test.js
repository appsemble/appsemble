import Koa from 'koa';
import request from 'supertest';

import sequelizeMiddleware from './sequelize';

describe('sequelizeMiddleware', () => {
  it('should include the database in ctx', async () => {
    let result;
    const db = Symbol('db');
    const koa = new Koa();

    koa.use(sequelizeMiddleware(db));
    koa.use(async (ctx) => {
      result = ctx.state.db;
    });

    await request(koa.callback()).get('/');

    expect(result).toBe(db);
  });
});
