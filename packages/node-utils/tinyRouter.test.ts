import { noop } from '@appsemble/utils';
import { type Boom } from '@hapi/boom';
import { request, setTestApp } from 'axios-test-instance';
import Koa, { type Context } from 'koa';

import { tinyRouter } from './tinyRouter.js';

let app: Koa;
let context: Context;

beforeEach(async () => {
  app = new Koa();
  app.silent = true;
  app.use((ctx, next) => {
    context = ctx;
    return next();
  });
  await setTestApp(app);
});

it('should assign the match group to params', async () => {
  app.use(
    tinyRouter([
      {
        route: /^\/(?<foo>.+)\/(?<bar>.+)/,
        get: noop,
      },
    ]),
  );
  await request.get('/1/2');
  expect(context.params).toStrictEqual({ foo: '1', bar: '2' });
});

it('should throw method not allowed if a URL is matched, but not for the given method', async () => {
  let error: Boom;
  app.on('error', (err) => {
    error = err;
  });
  app.use(
    tinyRouter([
      {
        route: '/',
        get: noop,
      },
    ]),
  );
  await request.post('/');
  expect(error.isBoom).toBe(true);
  expect(error.output.statusCode).toBe(405);
});

it('should fall back to the any handler if it exists', async () => {
  const any = vi.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        any,
      },
    ]),
  );
  await request.post('/');
  expect(any).toHaveBeenCalledWith(context, expect.any(Function));
});

it('should pick method specific middleware over any', async () => {
  const any = vi.fn();
  const get = vi.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        any,
        get,
      },
    ]),
  );
  await request.get('/');
  expect(any).not.toHaveBeenCalled();
  expect(get).toHaveBeenCalledWith(context, expect.any(Function));
});

it('should not call next if there are matching routes', async () => {
  const middleware = vi.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        get: noop,
      },
    ]),
  );
  app.use(middleware);
  await request.get('/');
  expect(middleware).not.toHaveBeenCalled();
});

it('should call next if there are no matching routes', async () => {
  const middleware = vi.fn();
  app.use(tinyRouter([]));
  app.use(middleware);
  await request.get('/');
  expect(middleware).toHaveBeenCalledWith(context, expect.any(Function));
});
