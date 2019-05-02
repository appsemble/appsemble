import path from 'path';

import fs from 'fs-extra';
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
  await testToken(request, server, db, 'apps:read apps:write');
});

afterAll(async () => {
  await db.close();
});

it('should scale and serve the app icon', async () => {
  const { id } = await App.create(
    {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      icon: await fs.readFile(path.join(__dirname, '__fixtures__', 'tux.png')),
      OrganizationId: 'testorganization',
    },
    { raw: true },
  );
  const response = await request(server).get(`/${id}/icon-150.png`);
  expect(response.type).toBe('image/png');
  expect(response.body).toMatchImageSnapshot();
});

it('should set a background color if the opaque query parameter is passed', async () => {
  const { id } = await App.create(
    {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        theme: {
          themeColor: '#00c52b',
        },
      },
      icon: await fs.readFile(path.join(__dirname, '__fixtures__', 'tux.png')),
      OrganizationId: 'testorganization',
    },
    { raw: true },
  );
  const response = await request(server).get(`/${id}/icon-99.png?opaque`);
  expect(response.type).toBe('image/png');
  expect(response.body).toMatchImageSnapshot();
});

it('should fall back to a white background color', async () => {
  const { id } = await App.create(
    {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      icon: await fs.readFile(path.join(__dirname, '__fixtures__', 'tux.png')),
      OrganizationId: 'testorganization',
    },
    { raw: true },
  );
  const response = await request(server).get(`/${id}/icon-64.png?opaque`);
  expect(response.type).toBe('image/png');
  expect(response.body).toMatchImageSnapshot();
});

it('should fall back to the Appsemble icon as default', async () => {
  const { id } = await App.create(
    {
      path: 'test-app',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'testorganization',
    },
    { raw: true },
  );
  const response = await request(server).get(`/${id}/icon-48.png`);
  expect(response.type).toBe('image/png');
  expect(response.body).toMatchImageSnapshot();
});
