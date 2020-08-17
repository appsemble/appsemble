import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { appRouter } from '.';
import type { App } from '../../models';
import * as appUtils from '../../utils/app';

beforeAll(async () => {
  await setTestApp(new Koa().use(appRouter));
});

it('should serve a PWA manifest', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
    },
    OrganizationId: 'manitest',
  } as Partial<App>) as App);
  const response = await request.get('/manifest.json');
  expect(response).toMatchObject({
    status: 200,
    headers: expect.objectContaining({
      'content-type': 'application/manifest+json; charset=utf-8',
    }),
    data: {
      background_color: '#deffde',
      display: 'standalone',
      icons: [
        { sizes: '48x48', src: '/icon-48.png', type: 'image/png' },
        { sizes: '144x144', src: '/icon-144.png', type: 'image/png' },
        { sizes: '192x192', src: '/icon-192.png', type: 'image/png' },
        { sizes: '512x512', src: '/icon-512.png', type: 'image/png' },
      ],
      name: 'Test App',
      orientation: 'any',
      scope: '/',
      short_name: 'Test App',
      start_url: '/test-page',
      theme_color: '#fa86ff',
    },
  });
});

it('should fallback to sane defaults', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue(({
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
    },
    OrganizationId: 'manitest',
  } as Partial<App>) as App);
  const response = await request.get('/manifest.json');
  expect(response).toMatchObject({
    status: 200,
    headers: expect.objectContaining({
      'content-type': 'application/manifest+json; charset=utf-8',
    }),
    data: {
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { sizes: '48x48', src: '/icon-48.png', type: 'image/png' },
        { sizes: '144x144', src: '/icon-144.png', type: 'image/png' },
        { sizes: '192x192', src: '/icon-192.png', type: 'image/png' },
        { sizes: '512x512', src: '/icon-512.png', type: 'image/png' },
      ],
      name: 'Test App',
      orientation: 'any',
      scope: '/',
      short_name: 'Test App',
      start_url: '/test-page',
      theme_color: '#ffffff',
    },
  });
});
