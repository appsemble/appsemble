import { logger } from '@appsemble/node-utils';
import Koa from 'koa';
import lolex from 'lolex';
import supertest from 'supertest';

import loggerMiddleware from './loggerMiddleware';

let app;
let clock;
let request;

beforeEach(() => {
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'log').mockImplementation(() => {});
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  clock = lolex.install();
  app = new Koa();
  app.use((ctx, next) => {
    Object.defineProperty(ctx.request, 'origin', {
      value: 'https://example.com:1337',
    });
    return next();
  });
  app.use(loggerMiddleware());
  app.silent = true;
  request = supertest(app.callback());
});

afterEach(() => {
  clock.uninstall();
});

it('should log requests', async () => {
  await request.get('/pizza');
  expect(logger.info).toHaveBeenCalledWith('GET https://example.com:1337/pizza — ::ffff:127.0.0.1');
});

it('should log success responses as info', async () => {
  app.use(ctx => {
    clock.tick(1);
    ctx.status = 200;
  });
  await request.get('/fries');
  expect(logger.info).toHaveBeenCalledWith('GET https://example.com:1337/fries 200 OK 1ms');
});

it('should log bad responses as warn', async () => {
  app.use(ctx => {
    clock.tick(3);
    ctx.status = 400;
  });
  await request.get('/burrito');
  expect(logger.warn).toHaveBeenCalledWith(
    'GET https://example.com:1337/burrito 400 Bad Request 3ms',
  );
});

it('should log error responses as error', async () => {
  app.use(ctx => {
    clock.tick(53);
    ctx.status = 503;
  });
  await request.get('/wrap');
  expect(logger.error).toHaveBeenCalledWith(
    'GET https://example.com:1337/wrap 503 Service Unavailable 53ms',
  );
});

it('should log errors as internal server errors and rethrow', async () => {
  const spy = jest.fn();
  app.on('error', spy);
  app.use(() => {
    clock.tick(86);
    throw new Error('fail');
  });
  await request.get('/taco');
  expect(spy).toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(
    'GET https://example.com:1337/taco 500 Internal Server Error 86ms',
  );
});

it('should append the response length if it is defined', async () => {
  app.use(ctx => {
    clock.tick(1);
    ctx.status = 200;
    ctx.body = '{}';
  });
  await request.get('/fries');
  expect(logger.info).toHaveBeenCalledWith('GET https://example.com:1337/fries 200 OK 1ms');
});
