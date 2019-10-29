import Koa from 'koa';
import request from 'supertest';

import appMapper from './appMapper';

let platformMiddleware;
let appMiddleware;
let fallbackMiddleware;
let fakeHostname;
let app;
let context;

beforeEach(() => {
  platformMiddleware = jest.fn();
  appMiddleware = jest.fn();
  fallbackMiddleware = jest.fn();
  fakeHostname = 'localhost';
  app = new Koa();
  app.context.argv = { host: 'http://localhost:1337' };
  app.context.db = {
    models: {
      App: {
        findOne: jest.fn(),
      },
    },
  };
  app.use((ctx, next) => {
    Object.defineProperty(ctx, 'hostname', { value: fakeHostname });
    context = ctx;
    return next();
  });
  app.use(appMapper(platformMiddleware, appMiddleware, fallbackMiddleware));
});

it('should call platform middleware if the request matches the host', async () => {
  await request(app.callback()).get('/');
  expect(platformMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
  expect(appMiddleware).not.toHaveBeenCalled();
  expect(fallbackMiddleware).not.toHaveBeenCalled();
});

it('should call app middleware if the request matches an app path', async () => {
  app.context.db.models.App.findOne.mockReturnValue(Promise.resolve({}));
  await request(app.callback()).get('/@organization/app');
  expect(app.context.db.models.App.findOne).toHaveBeenCalledWith({
    raw: true,
    where: { OrganizationId: 'organization', path: 'app' },
  });
  expect(context.state.base).toBe('/@organization/app');
  expect(platformMiddleware).not.toHaveBeenCalled();
  expect(appMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
  expect(fallbackMiddleware).not.toHaveBeenCalled();
});

it('should call app middleware if the request matches an app domain', async () => {
  fakeHostname = 'not.localhost';
  app.context.db.models.App.findOne.mockReturnValue(Promise.resolve({}));
  await request(app.callback()).get('/');
  expect(app.context.db.models.App.findOne).toHaveBeenCalledWith({
    raw: true,
    where: { domain: 'not.localhost' },
  });
  expect(context.state.base).toBe('');
  expect(platformMiddleware).not.toHaveBeenCalled();
  expect(appMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
  expect(fallbackMiddleware).not.toHaveBeenCalled();
});

it('should call platform middleware if the request matches an ip address, but no app domain', async () => {
  fakeHostname = '192.168.13.37';
  app.context.db.models.App.findOne.mockReturnValue(Promise.resolve(null));
  await request(app.callback()).get('/');
  expect(app.context.db.models.App.findOne).toHaveBeenCalledWith({
    raw: true,
    where: { domain: '192.168.13.37' },
  });
  expect(context.state.base).toBeUndefined();
  expect(platformMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
  expect(appMiddleware).not.toHaveBeenCalled();
  expect(fallbackMiddleware).not.toHaveBeenCalled();
});

it('should call fallback middleware if the request matches an custom domain not linked to an app', async () => {
  fakeHostname = 'example.com';
  app.context.db.models.App.findOne.mockReturnValue(Promise.resolve(null));
  await request(app.callback()).get('/');
  expect(app.context.db.models.App.findOne).toHaveBeenCalledWith({
    raw: true,
    where: { domain: 'example.com' },
  });
  expect(context.state.base).toBe('');
  expect(platformMiddleware).not.toHaveBeenCalled();
  expect(appMiddleware).not.toHaveBeenCalled();
  expect(fallbackMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
});
