import { logger } from '@appsemble/node-utils';
import Koa from 'koa';
import supertest from 'supertest';

import loggerMiddleware from './loggerMiddleware';

let app;
let now;
let request;

beforeEach(() => {
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'log').mockImplementation(() => {});
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  now = 0;
  app = new Koa();
  app.use(loggerMiddleware());
  app.silent = true;
  request = supertest(app.callback());
});

it('should log requests', async () => {
  await request.get('/pizza');
  expect(logger.info).toHaveBeenCalledWith('GET /pizza');
});

it('should log success responses as info', async () => {
  app.use(ctx => {
    now = 1;
    ctx.status = 200;
  });
  await request.get('/fries');
  expect(logger.log).toHaveBeenCalledWith('info', 'GET /fries 200 OK 1ms');
});

it('should log bad responses as warn', async () => {
  app.use(ctx => {
    now = 3;
    ctx.status = 400;
  });
  await request.get('/burrito');
  expect(logger.log).toHaveBeenCalledWith('warn', 'GET /burrito 400 Bad Request 3ms');
});

it('should log error responses as error', async () => {
  app.use(ctx => {
    now += 53;
    ctx.status = 503;
  });
  await request.get('/wrap');
  expect(logger.log).toHaveBeenCalledWith('error', 'GET /wrap 503 Service Unavailable 53ms');
});

it('should log errors as internal server errors and rethrow', async () => {
  const spy = jest.fn();
  app.on('error', spy);
  app.use(() => {
    now += 86;
    throw new Error('fail');
  });
  await request.get('/taco');
  expect(spy).toHaveBeenCalled();
  expect(logger.log).toHaveBeenCalledWith('error', 'GET /taco 500 Internal Server Error 86ms');
});

it('should append the response length if it is defined', async () => {
  app.use(ctx => {
    now = 1;
    ctx.status = 200;
    ctx.body = '{}';
  });
  await request.get('/fries');
  expect(logger.log).toHaveBeenCalledWith('info', 'GET /fries 200 OK 1ms');
});
