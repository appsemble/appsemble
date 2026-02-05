import { errorMiddleware } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { App, getAppDB, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';

describe('blockCSSHandler', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost' });
    await setTestApp(
      new Koa()
        .use((ctx, next) => {
          Object.defineProperty(ctx, 'URL', { value: new URL('http://app.org.localhost') });
          return next();
        })
        .use(errorMiddleware())
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
    const { AppBlockStyle } = await getAppDB(app.id);
    await AppBlockStyle.create({
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
});
