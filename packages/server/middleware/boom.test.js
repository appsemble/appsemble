import Boom from '@hapi/boom';
import Koa from 'koa';
import request from 'supertest';

import boom from './boom';

describe('boomMiddleware', () => {
  let app;

  beforeEach(() => {
    app = new Koa();
    app.use(boom());
  });

  it('should catch boom errors', async () => {
    app.use(() => {
      throw Boom.notFound('Error not found', "It's nowhere to be seen!");
    });

    const response = await request(app.callback()).get('/');

    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Error not found',
      data: "It's nowhere to be seen!",
    });
  });

  it('should rethrow non-boom errors', async () => {
    const error = new Error('This is a test error');
    let result;

    app.use(() => {
      throw error;
    });
    app.on('error', err => {
      result = err;
    });

    await request(app.callback()).get('/');

    expect(result).toBe(error);
  });

  it('should set Koa headers correctly', async () => {
    app.use(() => {
      throw Boom.unauthorized('Not authorized!', [
        'Basic realm="Access to test data", charset="UTF-8"',
      ]);
    });

    const response = await request(app.callback()).get('/');

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
