import { request, setTestApp } from 'axios-test-instance';
import fs from 'fs';
import Koa from 'koa';
import path from 'path';

import type { App } from '../../models';
import * as appUtils from '../../utils/app';
import appRouter from '.';

function readIcon(): Promise<Buffer> {
  return fs.promises.readFile(path.join(__dirname, '__fixtures__', 'tux.png'));
}

beforeAll(async () => {
  request.defaults.responseType = 'arraybuffer';
  await setTestApp(new Koa().use(appRouter));
});

it('should scale and serve the app icon', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    icon: await readIcon(),
  } as Partial<App>) as App);
  const response = await request.get('/icon-150.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should use the splash color if an opaque icon is requested', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    definition: { theme: { splashColor: '#ff0000', themeColor: '#00ff00' } },
    icon: await readIcon(),
  } as Partial<App>) as App);
  const response = await request.get('/icon-52.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the theme color if splash color is undefined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    definition: { theme: { themeColor: '#00ff00' } },
    icon: await readIcon(),
  } as Partial<App>) as App);
  const response = await request.get('/icon-85.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to a white background if neither theme color not splash color is defined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    definition: { theme: {} },
    icon: await readIcon(),
  } as Partial<App>) as App);
  const response = await request.get('/icon-24.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to a white background if theme is undefined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    definition: {},
    icon: await readIcon(),
  } as Partial<App>) as App);
  const response = await request.get('/icon-235.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the Appsemble icon if no app icon is defined', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({} as Partial<App>) as App);
  const response = await request.get('/icon-42.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});
