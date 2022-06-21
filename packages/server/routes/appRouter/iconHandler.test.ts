import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { appRouter } from '.';
import { App, Organization } from '../../models';
import * as appUtils from '../../utils/app';
import { useTestDatabase } from '../../utils/test/testSchema';

useTestDatabase('iconHandler');

beforeAll(async () => {
  request.defaults.responseType = 'arraybuffer';
  await setTestApp(new Koa().use(appRouter));
});

it('should scale and serve the app icon', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: new App({
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
    }),
  });
  const response = await request.get('/icon-150.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should use the splash color if an opaque icon is requested', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: new App({
      definition: { theme: { splashColor: '#ff0000', themeColor: '#00ff00' } },
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
    }),
  });
  const response = await request.get('/icon-52.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the theme color if splash color is undefined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: new App({
      definition: { theme: { themeColor: '#00ff00' } },
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
    }),
  });
  const response = await request.get('/icon-85.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to a white background if neither theme color not splash color is defined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: new App({
      definition: { theme: {} },
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
    }),
  });
  const response = await request.get('/icon-24.png?maskable=true');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to a white background if theme is undefined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: new App({
      definition: {},
      icon: await readFixture('tux.png'),
      updated: new Date('2020-01-01T00:00:00.000Z'),
    }),
  });
  const response = await request.get('/icon-235.png?maskable=true');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the organization icon if no app app icon is defined', async () => {
  const app = new App();
  app.Organization = new Organization({
    icon: await readFixture('nodejs-logo.png'),
    updated: new Date('2020-01-01T00:00:00.000Z'),
  });
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({ app });
  const response = await request.get('/icon-42.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the mobile-alt FontAwesome icon if no app or organization icon is defined', async () => {
  const app = new App();
  app.Organization = new Organization();
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({ app });
  const response = await request.get('/icon-42.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});
