import Boom from 'boom';

import boomMiddleware from './boom';

describe('boomMiddleware', () => {
  it('catches boom errors', () => {
    const ctx = {};
    const mockNext = jest.fn(() => {
      throw Boom.notFound('Error not found');
    });

    boomMiddleware(ctx, mockNext);

    expect(ctx.body).toBeDefined();
    expect(ctx.body).toEqual({ statusCode: 404, error: 'Not Found', message: 'Error not found' });
    expect(ctx.status).toBe(404);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('rethrows non-boom errors', async () => {
    const ctx = {};
    const error = new Error('This is a test error');

    const mockNext = jest.fn(() => {
      throw error;
    });

    await expect(boomMiddleware(ctx, mockNext)).rejects.toEqual(error);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
