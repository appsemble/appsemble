import request from 'supertest';

import createServer from '../../utils/createServer';
import truncate from '../../utils/test/truncate';
import testSchema from '../../utils/test/testSchema';
import testToken from '../../utils/test/testToken';

let App;
let db;
let server;

beforeAll(async () => {
  db = await testSchema('apps');

  server = await createServer({ db });
  ({ App } = db.models);
}, 10e3);

beforeEach(async () => {
  await truncate(db);
  await testToken(request, server, db, 'apps:read apps:write', 'manitest');
});

afterAll(async () => {
  await db.close();
});

it('should serve a PWA manifest', async () => {
  const { id } = await App.create(
    {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        theme: { backgroundColor: '#deffde', themeColor: '#fa86ff' },
      },
      OrganizationId: 'manitest',
    },
    { raw: true },
  );
  const response = await request(server).get(`/${id}/manifest.json`);
  expect(response.type).toBe('application/manifest+json');
  expect(response.body).toStrictEqual({
    background_color: '#deffde',
    display: 'standalone',
    icons: [
      { sizes: '48x48', src: `/${id}/icon-48.png`, type: 'image/png' },
      { sizes: '144x144', src: `/${id}/icon-144.png`, type: 'image/png' },
      { sizes: '192x192', src: `/${id}/icon-192.png`, type: 'image/png' },
      { sizes: '512x512', src: `/${id}/icon-512.png`, type: 'image/png' },
    ],
    name: 'Test App',
    orientation: 'any',
    scope: '/test-app',
    short_name: 'Test App',
    start_url: '/test-app/test-page',
    theme_color: '#fa86ff',
  });
});

it('should fallback to sane defaults', async () => {
  const { id } = await App.create(
    {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'manitest',
    },
    { raw: true },
  );
  const response = await request(server).get(`/${id}/manifest.json`);
  expect(response.type).toBe('application/manifest+json');
  expect(response.body).toStrictEqual({
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      { sizes: '48x48', src: `/${id}/icon-48.png`, type: 'image/png' },
      { sizes: '144x144', src: `/${id}/icon-144.png`, type: 'image/png' },
      { sizes: '192x192', src: `/${id}/icon-192.png`, type: 'image/png' },
      { sizes: '512x512', src: `/${id}/icon-512.png`, type: 'image/png' },
    ],
    name: 'Test App',
    orientation: 'any',
    scope: '/test-app',
    short_name: 'Test App',
    start_url: '/test-app/test-page',
    theme_color: '#ffffff',
  });
});
