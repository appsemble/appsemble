import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { App, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';

let app: App;

async function enterPassword(password: string): Promise<string> {
  const response = await request.post('/', new URLSearchParams({ password }), {
    maxRedirects: 0,
  });
  return (response.headers['set-cookie'] ?? []).map((cookie) => cookie.split(';')[0]).join('; ');
}

describe('appRouter', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = new Koa();
    server.keys = ['test'];
    await setTestApp(
      server
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
      passwordMessage: 'This app is in a closed test.\nAsk the team for access.',
    });
  });

  it('should show the password page with the message instead of the app', async () => {
    const response = await request.get('/en/home');

    expect(response).toMatchObject({
      status: 200,
      data: {
        filename: 'app/password.html',
        data: { error: false, message: 'This app is in a closed test.\nAsk the team for access.' },
      },
    });
  });

  it('should refuse the files of a password protected app without the password', async () => {
    const response = await request.get('/robots.txt');

    expect(response.status).toBe(401);
  });

  it('should show the password page with an error for a wrong password', async () => {
    const response = await request.post('/', new URLSearchParams({ password: 'guess' }));

    expect(response).toMatchObject({
      status: 401,
      data: { filename: 'app/password.html', data: { error: true } },
    });
  });

  it('should open the app after the password is entered', async () => {
    const cookie = await enterPassword('open sesame');

    const response = await request.get('/robots.txt', { headers: { cookie } });

    expect(response.status).toBe(200);
  });

  it('should remember the password in a cookie that scripts and other sites cannot use', async () => {
    const response = await request.post('/', new URLSearchParams({ password: 'open sesame' }), {
      maxRedirects: 0,
    });

    expect(response.status).toBe(302);
    expect(response.headers['set-cookie']?.[0]).toMatch(
      /^app_password=[\w-]+; path=\/; samesite=lax; secure; httponly$/,
    );
  });

  it('should ask for the password again after the password changes', async () => {
    const cookie = await enterPassword('open sesame');
    await app.update({ password: await hash('new secret', 10) });

    const response = await request.get('/robots.txt', { headers: { cookie } });

    expect(response.status).toBe(401);
  });

  it('should serve the app to anyone without password protection', async () => {
    await app.update({ password: null });

    const response = await request.get('/robots.txt');

    expect(response.status).toBe(200);
  });
});
