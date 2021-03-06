import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { KoaContext, KoaMiddleware } from '../types';
import { setArgv } from '../utils/argv';
import { appMapper } from './appMapper';

let platformMiddleware: KoaMiddleware;
let appMiddleware: KoaMiddleware;
let fakeHostname: string;
let context: KoaContext;

beforeEach(async () => {
  setArgv({ host: 'http://localhost:1337' });
  platformMiddleware = jest.fn();
  appMiddleware = jest.fn();
  fakeHostname = 'localhost';
  const app = new Koa();
  app.use((ctx: KoaContext, next) => {
    Object.defineProperty(ctx, 'hostname', { value: fakeHostname });
    context = ctx;
    return next();
  });
  app.use(appMapper(platformMiddleware, appMiddleware));
  await setTestApp(app);
});

it('should call platform middleware if the request matches the host', async () => {
  await request.get('/');
  expect(platformMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
  expect(appMiddleware).not.toHaveBeenCalled();
});

it('should call app middleware if the request matches another', async () => {
  fakeHostname = 'not.localhost';
  await request.get('/');
  expect(platformMiddleware).not.toHaveBeenCalled();
  expect(appMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
});

it('should call platform middleware if the request matches an ip address, but no app domain', async () => {
  fakeHostname = '192.168.13.37';
  await request.get('/');
  expect(platformMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
  expect(appMiddleware).not.toHaveBeenCalled();
});
