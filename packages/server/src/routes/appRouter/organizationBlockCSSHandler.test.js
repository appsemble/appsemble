import { createInstance } from 'axios-test-instance';
import Koa from 'koa';

import boomMiddleware from '../../middleware/boom';
import { Organization } from '../../models';
import testSchema from '../../utils/test/testSchema';
import truncate from '../../utils/test/truncate';
import appRouter from '.';

let request;
let db;

beforeAll(async () => {
  db = await testSchema('cssHandler');
  request = await createInstance(
    new Koa()
      .use((ctx, next) => {
        ctx.argv = { host: 'http://localhost' };
        Object.defineProperty(ctx, 'origin', { value: 'http://app.org.localhost' });
        return next();
      })
      .use(boomMiddleware())
      .use(appRouter),
  );
});

afterEach(async () => {
  await truncate();
});

afterAll(async () => {
  await request.close();
  await db.close();
});

it('should serve app block CSS', async () => {
  const org = await Organization.create({ id: 'org' });
  await org.createApp({
    definition: {},
    path: 'app',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  await org.createOrganizationBlockStyle({
    block: '@foo/bar',
    style: 'body { color: cyan; }',
  });
  const response = await request.get('/organization/@foo/bar.css');
  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/css; charset=utf-8',
    },
    data: 'body { color: cyan; }',
  });
});

it('should fallback to empty CSS', async () => {
  const org = await Organization.create({ id: 'org' });
  await org.createApp({
    definition: {},
    path: 'app',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  const response = await request.get('/organization/@foo/bar.css');
  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/css; charset=utf-8',
    },
    data: '',
  });
});

it('should handle if an app is not found', async () => {
  const response = await request.get('/organization/@foo/bar.css');
  expect(response).toMatchObject({
    status: 404,
    data: {
      error: 'Not Found',
      message: 'Not Found',
      statusCode: 404,
    },
  });
});
