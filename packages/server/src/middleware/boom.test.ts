import { notFound, unauthorized } from '@hapi/boom';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { boomMiddleware } from './boom';

describe('boomMiddleware', () => {
  let app: Koa;

  beforeEach(async () => {
    app = new Koa();
    app.use(boomMiddleware());
    await setTestApp(app);
  });

  it('should catch boom errors', async () => {
    app.use(() => {
      throw notFound('Error not found', "It's nowhere to be seen!");
    });

    const response = await request.get('/');

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Error not found',
        data: "It's nowhere to be seen!",
      },
    });
  });

  it('should rethrow non-boom errors', async () => {
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
    app.use(() => {
      throw unauthorized('Not authorized!', ['Basic realm="Access to test data", charset="UTF-8"']);
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
