import Koa from 'koa';
import request from 'supertest';

import appRouter from '.';

let app;
let state;

beforeEach(async () => {
  state = {};
  app = new Koa();
  app.use((ctx, next) => {
    Object.assign(ctx.state, state);
    return next();
  });
  app.use(appRouter);
});

it('should serve a PWA manifest', async () => {
  state.app = {
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
    },
    OrganizationId: 'manitest',
  };
  const response = await request(app.callback()).get('/manifest.json');
  expect(response.type).toBe('application/manifest+json');
  expect(response.body).toStrictEqual({
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
  });
});

it('should use a base in the PWA manifest if it is defined', async () => {
  state.base = '/@manitest/test-app';
  state.app = {
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
    },
    OrganizationId: 'manitest',
  };
  const response = await request(app.callback()).get('/@manitest/test-app/manifest.json');
  expect(response.type).toBe('application/manifest+json');
  expect(response.body).toStrictEqual({
    background_color: '#deffde',
    display: 'standalone',
    icons: [
      { sizes: '48x48', src: '/@manitest/test-app/icon-48.png', type: 'image/png' },
      { sizes: '144x144', src: '/@manitest/test-app/icon-144.png', type: 'image/png' },
      { sizes: '192x192', src: '/@manitest/test-app/icon-192.png', type: 'image/png' },
      { sizes: '512x512', src: '/@manitest/test-app/icon-512.png', type: 'image/png' },
    ],
    name: 'Test App',
    orientation: 'any',
    scope: '/@manitest/test-app',
    short_name: 'Test App',
    start_url: '/@manitest/test-app/test-page',
    theme_color: '#fa86ff',
  });
});

it('should fallback to sane defaults', async () => {
  state.app = {
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
    },
    OrganizationId: 'manitest',
  };
  const response = await request(app.callback()).get('/manifest.json');
  expect(response.type).toBe('application/manifest+json');
  expect(response.body).toStrictEqual({
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
  });
});
