import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { App, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';

let app: App;

describe('appRouter', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost' });
    await setTestApp(
      new Koa()
        .use((ctx, next) => {
          Object.defineProperty(ctx, 'URL', { value: new URL('http://app.org.localhost') });
          return next();
        })
        .use(appRouter),
    );
  });

  beforeEach(async () => {
    await Organization.create({ id: 'org' });
    app = await App.create({
      OrganizationId: 'org',
      definition: {},
      path: 'app',
      vapidPrivateKey: '',
      vapidPublicKey: '',
      password: await hash('open sesame', 10),
    });
  });

  it('should ask for the password of a password protected app', async () => {
    const response = await request.get('/robots.txt');

    expect(response).toMatchObject({
      status: 401,
      headers: { 'www-authenticate': 'Basic realm="App", charset="UTF-8"' },
    });
  });

  it('should refuse a wrong password', async () => {
    const response = await request.get('/robots.txt', {
      auth: { username: 'tester', password: 'guess' },
    });

    expect(response.status).toBe(401);
  });

  it('should serve a password protected app with the password and any username', async () => {
    const response = await request.get('/robots.txt', {
      auth: { username: 'anyone', password: 'open sesame' },
    });

    expect(response.status).toBe(200);
  });

  it('should refuse the old password after the password changes', async () => {
    const auth = { username: 'tester', password: 'open sesame' };
    await request.get('/robots.txt', { auth });
    await app.update({ password: await hash('new secret', 10) });

    const response = await request.get('/robots.txt', { auth });

    expect(response.status).toBe(401);
  });

  it('should serve the app to anyone without password protection', async () => {
    await app.update({ password: null });

    const response = await request.get('/robots.txt');

    expect(response.status).toBe(200);
  });
});
