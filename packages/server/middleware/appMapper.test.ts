import { request, setTestApp } from 'axios-test-instance';
import Koa, { type Context, type Middleware } from 'koa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appMapper } from './appMapper.js';
import { AppCollection, Organization } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let platformMiddleware: Middleware;
let appMiddleware: Middleware;
let fakeHostname: string;
let context: Context;

useTestDatabase(import.meta);

describe('Appsemble server', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost:1337' });
    platformMiddleware = vi.fn();
    appMiddleware = vi.fn();
    fakeHostname = 'localhost';
    const app = new Koa();
    app.use((ctx, next) => {
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

  it('should call platform middleware if the request matches a custom app collection domain', async () => {
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    const collection = await AppCollection.create({
      name: 'test',
      domain: 'test.com',
      expertName: 'test',
      visibility: 'public',
      headerImage: Buffer.from(''),
      headerImageMimeType: 'image/png',
      expertProfileImage: Buffer.from(''),
      expertProfileImageMimeType: 'image/png',
      OrganizationId: organization.id,
    });

    fakeHostname = 'test.com';
    await request.get('/');
    expect(platformMiddleware).toHaveBeenCalledWith(context, expect.any(Function));
    expect(appMiddleware).not.toHaveBeenCalled();
    expect(context.state.appCollectionId).toBeDefined();
    expect(context.state.appCollectionId).toStrictEqual(collection.id);
  });
});
