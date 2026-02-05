import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { App, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';

describe('iconHandler', () => {
  beforeAll(async () => {
    request.defaults.responseType = 'arraybuffer';
    const app = new Koa();
    app.use((ctx, next) => {
      Object.defineProperty(ctx, 'URL', {
        value: new URL('http://test-app.testorg.localhost:9999'),
      });
      return next();
    });
    app.use(appRouter);
    await setTestApp(app);
    setArgv({
      host: 'http://localhost:9999',
    });
  });

  beforeEach(async () => {
    await Organization.create({ id: 'testorg' });
  });

  it('should scale and serve the app icon', async () => {
    await App.create({
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
      definition: {},
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get('/icon-150.png');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should use the splash color if an opaque icon is requested', async () => {
    await App.create({
      definition: { theme: { splashColor: '#ff0000', themeColor: '#00ff00' } },
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get('/icon-52.png?opaque');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should fall back to the theme color if splash color is undefined', async () => {
    await App.create({
      definition: { theme: { themeColor: '#00ff00' } },
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get('/icon-85.png?opaque');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should fall back to a white background if neither theme color not splash color is defined', async () => {
    await App.create({
      definition: { theme: {} },
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get('/icon-24.png?maskable=true');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should fall back to a white background if theme is undefined', async () => {
    await App.create({
      definition: {},
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get('/icon-235.png?maskable=true');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should fall back to the organization icon if no app app icon is defined', async () => {
    await App.create({
      definition: {},
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    await Organization.update(
      { icon: await readFixture('nodejs-logo.png'), updated: new Date('2020-01-01T00:00:00.000Z') },
      { where: { id: 'testorg' } },
    );
    const response = await request.get('/icon-42.png');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should fall back to the mobile-alt FontAwesome icon if no app or organization icon is defined', async () => {
    App.create({
      definition: {},
      path: 'test-app',
      OrganizationId: 'testorg',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get('/icon-42.png');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should fall back to the mobile-alt FontAwesome icon if no is found', async () => {
    const response = await request.get('/icon-42.png');
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });
});
