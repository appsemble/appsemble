import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { App, AppScreenshot, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';

describe('manifestHandler', () => {
  beforeAll(async () => {
    const app = new Koa();
    app.use((ctx, next) => {
      Object.defineProperty(ctx, 'URL', {
        value: new URL('http://test-app.manitest.localhost:9999'),
      });
      return next();
    });
    app.use(appRouter);
    await setTestApp(app);
    setArgv({
      host: 'http://localhost:9999',
    });
  });

  it('should serve a PWA manifest', async () => {
    await Organization.create({ id: 'manitest' });
    await App.create({
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
      },
      OrganizationId: 'manitest',
      vapidPrivateKey: '',
      vapidPublicKey: '',
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
    await Organization.create({ id: 'manitest' });
    await App.create({
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'manitest',
      vapidPrivateKey: '',
      vapidPublicKey: '',
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
    await Organization.create({ id: 'manitest' });
    const app = await App.create({
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'manitest',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    await AppScreenshot.create({
      id: 42,
      width: 1080,
      height: 1920,
      mime: 'image/png',
      screenshot: Buffer.alloc(0),
      AppId: app.id,
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
});
