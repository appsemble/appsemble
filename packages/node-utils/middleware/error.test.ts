import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeEach, describe, expect, it } from 'vitest';

import { errorMiddleware } from './error.js';

describe('errorMiddleware', () => {
  let app: Koa;

  beforeEach(async () => {
    app = new Koa();
    app.use(errorMiddleware());
    await setTestApp(app);
  });

  it('should catch Koa errors', async () => {
    app.use((ctx) => {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'Error not found',
      };
      ctx.throw();
    });

    const response = await request.get('/');

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Error not found',
      },
    });
  });

  it('should rethrow non-Koa errors', async () => {
    app.silent = true;
    const error = new Error('This is a test error');
    let result;

    app.use(() => {
      throw error;
    });
    app.on('error', (err) => {
      result = err;
    });

    await request.get('/');

    expect(result).toBe(error);
  });

  it('should set Koa headers correctly', async () => {
    app.use((ctx) => {
      ctx.set('www-authenticate', 'Basic realm="Access to test data", charset="UTF-8"');
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Not authorized!',
        statusCode: 401,
      };
      ctx.throw();
    });

    const response = await request.get('/');

    expect(response).toMatchObject({
      status: 401,
      headers: expect.objectContaining({
        'www-authenticate': 'Basic realm="Access to test data", charset="UTF-8"',
      }),
      data: {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Not authorized!',
      },
    });
  });
});
