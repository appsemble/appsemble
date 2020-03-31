import { createInstance } from 'axios-test-instance';
import Koa from 'koa';

import boomMiddleware from '../../middleware/boom';
import testSchema from '../../utils/test/testSchema';
import appRouter from '.';

let request;
let db;

beforeEach(async () => {
  db = await testSchema('cssHandler');
  request = await createInstance(
    new Koa()
      .use((ctx, next) => {
        ctx.db = db;
        ctx.argv = { host: 'http://localhost' };
        Object.defineProperty(ctx, 'origin', { value: 'http://app.org.localhost' });
        return next();
      })
      .use(boomMiddleware())
      .use(appRouter),
  );
});

afterEach(async () => {
  await request.close();
  await db.close();
});

it('should serve app core CSS', async () => {
  const org = await db.models.Organization.create({ id: 'org' });
  await org.createApp({
    definition: {},
    path: 'app',
    style: 'body { color: red; }',
    sharedStyle: 'body { color: blue; }',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  const response = await request.get('/core.css');
  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/css; charset=utf-8',
    },
    data: 'body { color: red; }',
  });
});

it('should serve app shared CSS', async () => {
  const org = await db.models.Organization.create({ id: 'org' });
  await org.createApp({
    definition: {},
    path: 'app',
    style: 'body { color: red; }',
    sharedStyle: 'body { color: blue; }',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  const response = await request.get('/shared.css');
  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/css; charset=utf-8',
    },
    data: 'body { color: blue; }',
  });
});

it('should handle if an app is not found', async () => {
  const response = await request.get('/core.css');
  expect(response).toMatchObject({
    status: 404,
    data: {
      error: 'Not Found',
      message: 'Not Found',
      statusCode: 404,
    },
  });
});
