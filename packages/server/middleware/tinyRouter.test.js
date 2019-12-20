import Koa from 'koa';
import request from 'supertest';

import tinyRouter from './tinyRouter';

let app;
let context;

beforeEach(() => {
  app = new Koa();
  app.use((ctx, next) => {
    context = ctx;
    return next();
  });
});

it('should assign the match group to params', async () => {
  app.use(
    tinyRouter([
      {
        route: /^\/(?<foo>.+)\/(?<bar>.+)/,
        get() {},
      },
    ]),
  );
  await request(app.callback()).get('/1/2');
  expect(context.params).toStrictEqual({ foo: '1', bar: '2' });
});

it('should throw method not allowed if a URL is matched, but not for the given method', async () => {
  let error;
  app.on('error', err => {
    error = err;
  });
  app.use(
    tinyRouter([
      {
        route: '/',
        get() {},
      },
    ]),
  );
  await request(app.callback()).post('/');
  expect(error.isBoom).toBe(true);
  expect(error.output.statusCode).toBe(405);
});

it('should not call next if there are matching routes', async () => {
  const middleware = jest.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        get() {},
      },
    ]),
  );
  app.use(middleware);
  await request(app.callback()).get('/');
  expect(middleware).not.toHaveBeenCalled();
});

it('should call next if there are no matching routes', async () => {
  const middleware = jest.fn();
  app.use(tinyRouter([]));
  app.use(middleware);
  await request(app.callback()).get('/');
  expect(middleware).toHaveBeenCalled();
});
