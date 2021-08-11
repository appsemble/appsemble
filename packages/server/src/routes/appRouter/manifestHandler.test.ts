import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { appRouter } from '.';
import { App } from '../../models';
import * as appUtils from '../../utils/app';

beforeAll(async () => {
  await setTestApp(new Koa().use(appRouter));
});

it('should serve a PWA manifest', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
      },
      OrganizationId: 'manitest',
    } as Partial<App> as App,
  });
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
        {
          purpose: 'any',
          sizes: '48x48',
          src: '/icon-48.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '48x48',
          src: '/icon-48.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '144x144',
          src: '/icon-144.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '144x144',
          src: '/icon-144.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '192x192',
          src: '/icon-192.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '192x192',
          src: '/icon-192.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '512x512',
          src: '/icon-512.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '512x512',
          src: '/icon-512.png?maskable=true',
          type: 'image/png',
        },
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
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'manitest',
    } as Partial<App> as App,
  });
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
        {
          purpose: 'any',
          sizes: '48x48',
          src: '/icon-48.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '48x48',
          src: '/icon-48.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '144x144',
          src: '/icon-144.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '144x144',
          src: '/icon-144.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '192x192',
          src: '/icon-192.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '192x192',
          src: '/icon-192.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '512x512',
          src: '/icon-512.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '512x512',
          src: '/icon-512.png?maskable=true',
          type: 'image/png',
        },
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

it('should support screenshots', async () => {
  jest.spyOn(appUtils, 'getApp').mockResolvedValue({
    app: {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'manitest',
      AppScreenshots: [
        {
          id: 42,
          width: 1080,
          height: 1920,
          mime: 'image/png',
        },
      ],
    } as Partial<App> as App,
  });
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
        {
          purpose: 'any',
          sizes: '48x48',
          src: '/icon-48.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '48x48',
          src: '/icon-48.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '144x144',
          src: '/icon-144.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '144x144',
          src: '/icon-144.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '192x192',
          src: '/icon-192.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '192x192',
          src: '/icon-192.png?maskable=true',
          type: 'image/png',
        },
        {
          purpose: 'any',
          sizes: '512x512',
          src: '/icon-512.png',
          type: 'image/png',
        },
        {
          purpose: 'maskable',
          sizes: '512x512',
          src: '/icon-512.png?maskable=true',
          type: 'image/png',
        },
      ],
      name: 'Test App',
      orientation: 'any',
      scope: '/',
      screenshots: [
        {
          sizes: '1080x1920',
          src: '/screenshots/42.png',
          type: 'image/png',
        },
      ],
      short_name: 'Test App',
      start_url: '/test-page',
      theme_color: '#ffffff',
    },
  });
});
