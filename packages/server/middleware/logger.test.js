import { logger as log } from '@appsemble/node-utils';
import Koa from 'koa';
import supertest from 'supertest';

import logger from './logger';

describe('logger', () => {
  let app;
  let now;
  let request;

  beforeEach(() => {
    jest.spyOn(log, 'info').mockImplementation(() => {});
    jest.spyOn(log, 'log').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    now = 0;
    app = new Koa();
    app.use(logger());
    request = supertest(app.callback());
  });

  it('should log requests', async () => {
    await request.get('/pizza');
    expect(log.info).toHaveBeenCalledWith('GET /pizza');
  });

  it('should log success responses as info', async () => {
    app.use(ctx => {
      now = 1;
      ctx.status = 200;
    });
    await request.get('/fries');
    expect(log.log).toHaveBeenCalledWith('info', 'GET /fries 200 OK 1ms');
  });

  it('should log bad responses as warn', async () => {
    app.use(ctx => {
      now = 3;
      ctx.status = 400;
    });
    await request.get('/burrito');
    expect(log.log).toHaveBeenCalledWith('warn', 'GET /burrito 400 Bad Request 3ms');
  });

  it('should log error responses as error', async () => {
    app.use(ctx => {
      now += 53;
      ctx.status = 500;
    });
    await request.get('/wrap');
    expect(log.log).toHaveBeenCalledWith('error', 'GET /wrap 500 Internal Server Error 53ms');
  });

  it('should append the response length if it is defined', async () => {
    app.use(ctx => {
      now = 1;
      ctx.status = 200;
      ctx.body = '{}';
    });
    await request.get('/fries');
    expect(log.log).toHaveBeenCalledWith('info', 'GET /fries 200 OK 1ms');
  });
});
