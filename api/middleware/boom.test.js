import Boom from 'boom';
import Koa from 'koa';
import request from 'supertest';

import boomMiddleware from './boom';

describe('boomMiddleware', () => {
  it('should catch boom errors', async () => {
    const ctx = {};

    const mockNext = jest.fn(() => {
      throw Boom.notFound('Error not found');
    });

    await boomMiddleware(ctx, mockNext);

    expect(ctx.body).toBeDefined();
    expect(ctx.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Error not found',
    });
    expect(ctx.status).toBe(404);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should rethrow non-boom errors', async () => {
    const ctx = {};
    const error = new Error('This is a test error');

    const mockNext = jest.fn(() => {
      throw error;
    });

    await expect(boomMiddleware(ctx, mockNext)).rejects.toEqual(error);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should set Koa headers correctly', async () => {
    const koa = new Koa();
    koa.use(boomMiddleware);
    koa.use(async () => {
      throw Boom.unauthorized('Not authorized!', [
        'Basic realm="Access to test data", charset="UTF-8"',
      ]);
    });

    const response = await request(koa.callback()).get('/');

    expect(response.headers).toBeDefined();
    expect(response.headers['www-authenticate']).toBe(
      'Basic realm="Access to test data", charset="UTF-8"',
    );
    expect(response.body).toStrictEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Not authorized!',
    });
  });
});
