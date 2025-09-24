import { errorMiddleware } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { setArgv } from '../../index.js';
import { App } from '../../models/main/App.js';
import { Organization } from '../../models/main/Organization.js';

describe('robotsHandler', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost' });
    await setTestApp(
      new Koa()
        .use((ctx, next) => {
          Object.defineProperty(ctx, 'origin', { value: 'http://app.org.localhost' });
          return next();
        })
        .use(errorMiddleware())
        .use(appRouter),
    );
  });

  let app: App;

  beforeEach(async () => {
    await Organization.create({ id: 'org' });
    app = await App.create({
      OrganizationId: 'org',
      definition: {},
      path: 'app',
      visibility: 'public',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
  });

  it('should serve a valid robots.txt for public apps', async () => {
    app.visibility = 'public';
    await app.save();
    const response = await request.get('/robots.txt');

    expect(response).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
      data: 'User-agent: *\nAllow: *\n',
    });
  });

  it('should serve a restricted robots.txt for unlisted apps', async () => {
    app.visibility = 'unlisted';
    await app.save();

    const response = await request.get('/robots.txt');

    expect(response).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
      data: 'User-agent: *\nDisallow: /\n',
    });
  });

  it('should serve a restricted robots.txt for private apps', async () => {
    app.visibility = 'private';
    await app.save();

    const response = await request.get('/robots.txt');

    expect(response).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
      data: 'User-agent: *\nDisallow: /\n',
    });
  });

  it('should return 404 for unknown apps', async () => {
    await app.destroy();
    const response = await request.get('/robots.txt');

    expect(response).toMatchObject({
      status: 404,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      data: {
        message: 'App not found',
      },
    });
  });
});
