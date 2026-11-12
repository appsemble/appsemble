import { readFile } from 'node:fs/promises';

import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import Koa from 'koa';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { appRouter } from './index.js';
import { App, AppMessages, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';

let app: App;
const passwordMessage = 'This app is in a closed test.\nAsk the team for access.';

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
          ctx.fs = {
            promises: {
              readFile: () =>
                readFile(new URL('../../../app/password.html', import.meta.url), 'utf8'),
            },
          };
          return next();
        })
        .use(appRouter),
    );
  });

  beforeEach(async () => {
    await Organization.create({ id: 'org' });
    app = await App.create({
      OrganizationId: 'org',
      definition: { name: 'Test App', defaultPage: 'Test Page', pages: [] },
      path: 'app',
      vapidPrivateKey: '',
      vapidPublicKey: '',
      password: await hash('open sesame', 10),
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: { core: { 'server.passwordPage.message': passwordMessage } },
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('should show the password page with the message instead of the app', async () => {
    const response = await request.get('/en/home');

    expect(response).toMatchObject({
      status: 200,
      headers: { 'cache-control': 'private,no-store', vary: 'Cookie, Accept-Language' },
      data: {
        filename: 'app/password.html',
        data: { message: passwordMessage },
      },
    });
  });

  it.each([
    [
      'nl-NL,nl;q=0.9,en;q=0.8',
      'nl',
      'Wachtwoord vereist',
      'Deze app is beveiligd met een wachtwoord',
      'Wachtwoord',
      'Doorgaan',
    ],
    ['de', 'de', 'Passwort erforderlich', 'Diese App ist passwortgeschützt', 'Passwort', 'Weiter'],
    ['zz', 'en', 'Password required', 'This app is password protected', 'Password', 'Continue'],
    ['ang', 'ang', 'Password required', 'This app is password protected', 'Password', 'Continue'],
  ])('should localize the password page for %s', async (language, locale, ...text) => {
    vi.stubEnv('NODE_ENV', 'development');

    const response = await request.get('/', { headers: { 'Accept-Language': language } });

    expect(response.status).toBe(200);
    expect(response.headers['content-language']).toBe(locale);
    for (const value of [...text, passwordMessage]) {
      expect(response.data).toContain(value);
    }
  });

  it.each(['nl', 'it'])(
    'should show the %s translation of the message to visitors who speak it',
    async (language) => {
      await AppMessages.create({
        AppId: app.id,
        language,
        messages: { core: { 'server.passwordPage.message': `Message in ${language}` } },
      });

      const response = await request.get('/', { headers: { 'Accept-Language': language } });

      expect(response.data).toMatchObject({ data: { message: `Message in ${language}` } });
    },
  );

  it('should show the message in the default language of the app to other visitors', async () => {
    await app.update({ definition: { ...app.definition, defaultLanguage: 'nl_NL' } });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl-nl',
      messages: { core: { 'server.passwordPage.message': 'Vraag het team om toegang.' } },
    });

    const response = await request.get('/', { headers: { 'Accept-Language': 'de' } });

    expect(response.data).toMatchObject({ data: { message: 'Vraag het team om toegang.' } });
  });

  it('should show the message in the default language to visitors whose language keeps the default', async () => {
    await AppMessages.create({
      AppId: app.id,
      language: 'nl',
      messages: { core: { 'server.passwordPage.message': '' } },
    });

    const response = await request.get('/', { headers: { 'Accept-Language': 'nl' } });

    expect(response.data).toMatchObject({ data: { message: passwordMessage } });
  });

  it('should ask visitors of an app without a message to request the password from its owner', async () => {
    await AppMessages.destroy({ where: { AppId: app.id } });

    const response = await request.get('/', { headers: { 'Accept-Language': 'nl' } });

    expect(response.data).toMatchObject({
      data: { message: 'Vraag de eigenaar van deze app om het wachtwoord.' },
    });
  });

  it('should localize an incorrect password error', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const response = await request.post('/', new URLSearchParams({ password: 'guess' }), {
      headers: { 'Accept-Language': 'nl' },
    });

    expect(response.status).toBe(401);
    expect(response.data).toContain('Het wachtwoord is onjuist.');
  });

  it('should refuse the files of a password protected app without the password', async () => {
    const response = await request.get('/robots.txt');

    expect(response.status).toBe(401);
  });

  it('should show the password page with an error for a wrong password', async () => {
    const response = await request.post('/', new URLSearchParams({ password: 'guess' }));

    expect(response).toMatchObject({
      status: 401,
      data: { filename: 'app/password.html', data: { error: 'The password is incorrect.' } },
    });
  });

  it('should stop accepting password attempts after too many guesses', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request.post('/', new URLSearchParams({ password: 'guess' }));
      expect(response.status).toBe(401);
    }

    const response = await request.post('/', new URLSearchParams({ password: 'open sesame' }), {
      maxRedirects: 0,
    });

    expect(response).toMatchObject({
      status: 429,
      data: {
        filename: 'app/password.html',
        data: { error: 'Too many attempts. Try again later.' },
      },
    });
  });

  it('should keep accepting the correct password from testers who share an IP address', async () => {
    for (let tester = 0; tester < 11; tester += 1) {
      const response = await request.post('/', new URLSearchParams({ password: 'open sesame' }), {
        maxRedirects: 0,
      });
      expect(response.status).toBe(302);
    }
  });

  it('should open the app after the password is entered', async () => {
    const cookie = await enterPassword('open sesame');

    const response = await request.get('/robots.txt', { headers: { cookie } });

    expect(response.status).toBe(200);
  });

  it('should keep the app page containing the password token out of shared HTTP caches', async () => {
    const cookie = await enterPassword('open sesame');

    const response = await request.get('/', { headers: { cookie, host: 'app.org.localhost' } });

    expect(response).toMatchObject({
      status: 200,
      headers: { 'cache-control': 'private,no-store', vary: 'Cookie' },
      data: { filename: 'app/index.html' },
    });
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
