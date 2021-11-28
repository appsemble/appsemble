import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { appRouter } from '.';
import { boomMiddleware } from '../../middleware/boom';
import { App, AppBlockStyle, Organization } from '../../models';
import { setArgv } from '../../utils/argv';
import { useTestDatabase } from '../../utils/test/testSchema';

useTestDatabase('blockcsshandler');

beforeAll(async () => {
  setArgv({ host: 'http://localhost' });
  await setTestApp(
    new Koa()
      .use((ctx, next) => {
        Object.defineProperty(ctx, 'origin', { value: 'http://app.org.localhost' });
        return next();
      })
      .use(boomMiddleware())
      .use(appRouter),
  );
});

it('should serve app block CSS', async () => {
  await Organization.create({ id: 'org' });
  const app = await App.create({
    OrganizationId: 'org',
    definition: {},
    path: 'app',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  await AppBlockStyle.create({
    AppId: app.id,
    block: '@foo/bar',
    style: 'body { color: cyan; }',
  });
  const response = await request.get('/@foo/bar.css');
  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/css; charset=utf-8',
    },
    data: 'body { color: cyan; }',
  });
});

it('should fallback to empty CSS', async () => {
  await Organization.create({ id: 'org' });
  await App.create({
    OrganizationId: 'org',
    definition: {},
    path: 'app',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  const response = await request.get('/@foo/bar.css');
  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/css; charset=utf-8',
    },
    data: '',
  });
});

it('should handle if an app is not found', async () => {
  const response = await request.get('/@foo/bar.css');
  expect(response).toMatchObject({
    status: 404,
    data: {
      error: 'Not Found',
      message: 'App not found',
      statusCode: 404,
    },
  });
});
