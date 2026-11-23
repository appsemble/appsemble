import { getAppAssetLocation, uploadS3File } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';

let app: App;

function parseSettings(settings: string): { passwordToken: string } {
  return JSON.parse(settings.slice('<script>window.settings='.length, -'</script>'.length));
}

async function getPasswordTokenFromAppPage(
  password = 'open sesame',
): Promise<{ cookie: string; passwordToken: string }> {
  const login = await request.post('/', new URLSearchParams({ password }), {
    headers: { host: 'app.org.localhost' },
    maxRedirects: 0,
  });
  const cookie = login.headers['set-cookie']!.map((value) => value.split(';')[0]).join('; ');
  const { data } = await request.get<{ data: { settings: string } }>('/', {
    headers: {
      host: 'app.org.localhost',
      cookie,
    },
  });
  return {
    cookie,
    passwordToken: parseSettings(data.data.settings).passwordToken,
  };
}

describe('appPasswordProtection', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' });
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    await Organization.create({ id: 'org' });
    app = await App.create({
      OrganizationId: 'org',
      definition: { name: 'Test App', defaultPage: 'Test Page', pages: [] },
      path: 'app',
      visibility: 'public',
      showAppDefinition: true,
      vapidPrivateKey: '',
      vapidPublicKey: '',
      password: await hash('open sesame', 10),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(['', '/messages/en', '/resources/note', '/assets/logo'])(
    'should refuse %s of a password protected app to anonymous visitors',
    async (path) => {
      const response = await request.get(`/api/apps/${app.id}${path}`);

      expect(response.status).toBe(401);
    },
  );

  it('should serve the app content with the password token from the app page', async () => {
    const { passwordToken } = await getPasswordTokenFromAppPage();

    const response = await request.get(`/api/apps/${app.id}`, {
      headers: { 'X-Appsemble-Password-Token': passwordToken },
    });

    expect(response).toMatchObject({ status: 200, data: { definition: { name: 'Test App' } } });
    expect(response.headers.vary?.split(/,\s*/)).toContain('X-Appsemble-Password-Token');
  });

  it('should serve URL loaded app content with the password token as query parameter', async () => {
    const { passwordToken } = await getPasswordTokenFromAppPage();

    const response = await request.get(`/api/apps/${app.id}`, { params: { passwordToken } });

    expect(response.status).toBe(200);
  });

  it('should refuse a password token after the password changes', async () => {
    const { passwordToken } = await getPasswordTokenFromAppPage();
    await app.update({ password: await hash('new secret', 10) });

    const response = await request.get(`/api/apps/${app.id}`, {
      headers: { 'X-Appsemble-Password-Token': passwordToken },
    });

    expect(response.status).toBe(401);
  });

  it('should refuse a password token with a changed issue time', async () => {
    const { passwordToken } = await getPasswordTokenFromAppPage();
    const [, signature] = passwordToken.split('.');

    const response = await request.get(`/api/apps/${app.id}`, {
      headers: { 'X-Appsemble-Password-Token': `${Date.now() + 1000}.${signature}` },
    });

    expect(response.status).toBe(401);
  });

  it('should give each visitor 3 days from their own password entry', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T12:00:00Z'), toFake: ['Date'] });
    await getPasswordTokenFromAppPage();
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
    const { passwordToken } = await getPasswordTokenFromAppPage();

    vi.setSystemTime(new Date('2026-01-04T12:00:00Z'));
    const response = await request.get(`/api/apps/${app.id}`, {
      headers: { 'X-Appsemble-Password-Token': passwordToken },
    });

    expect(response.status).toBe(200);
  });

  it.each([
    ['app', '/'],
    ['app', '/core.css'],
    ['api', ''],
    ['api', '/style/core'],
  ])(
    'should not extend access beyond 3 days with a token the %s host returns for %s',
    async (host, path) => {
      await app.update({
        coreStyle: `body{background:url('http://localhost/api/apps/${app.id}/assets/background')}`,
      });
      vi.useFakeTimers({ now: new Date('2026-01-01T12:00:00Z'), toFake: ['Date'] });
      const { cookie, passwordToken } = await getPasswordTokenFromAppPage();

      vi.setSystemTime(new Date('2026-01-03T12:00:00Z'));
      const response = await request.get<{ data: { settings: string } } | string>(
        host === 'app' ? path : `/api/apps/${app.id}${path}`,
        {
          headers:
            host === 'app'
              ? { host: 'app.org.localhost', cookie }
              : { 'X-Appsemble-Password-Token': passwordToken },
        },
      );
      const { data } = response;
      let returnedToken: string;
      if (typeof data === 'string') {
        const [, reference] = data.match(/url\(\s*["']?([^\s"')]+)["']?\s*\)/)!;
        returnedToken = new URL(reference).searchParams.get('passwordToken')!;
      } else if ('data' in data) {
        returnedToken = parseSettings(data.data.settings).passwordToken;
      } else {
        returnedToken = (data as { passwordToken: string }).passwordToken;
      }
      vi.setSystemTime(new Date('2026-01-04T11:59:59Z'));
      const lastDay = await request.get(`/api/apps/${app.id}`, {
        headers: { 'X-Appsemble-Password-Token': returnedToken },
      });
      vi.setSystemTime(new Date('2026-01-04T12:00:00Z'));
      const expired = await request.get(`/api/apps/${app.id}`, {
        headers: { 'X-Appsemble-Password-Token': returnedToken },
      });

      expect([response.status, lastDay.status, expired.status]).toStrictEqual([200, 200, 401]);
    },
  );

  it.each([
    ['core', 'app'],
    ['shared', 'app'],
    ['block', 'app'],
    ['core', 'api'],
    ['shared', 'api'],
    ['block', 'api'],
  ])(
    'should keep %s stylesheet assets accessible through the %s host after password rotation',
    async (kind, host) => {
      const { Asset, AppBlockStyle } = await getAppDB(app.id);
      const asset = await Asset.create({ name: 'background', mime: 'image/svg+xml' });
      const { bucket, key } = getAppAssetLocation({ id: app.id }, asset.id);
      const content = '<svg xmlns="http://www.w3.org/2000/svg"/>';
      await uploadS3File(bucket, key, Buffer.from(content));
      const style = `body{background-image:url('http://localhost/api/apps/${app.id}/assets/background?passwordToken=stale#photo')}`;
      await app.update({ coreStyle: style, sharedStyle: style });
      await AppBlockStyle.create({ block: '@foo/bar', style });
      const path =
        host === 'app'
          ? kind === 'block'
            ? '/@foo/bar.css'
            : `/${kind}.css`
          : `/api/apps/${app.id}/style/${kind === 'block' ? 'block/@foo/bar' : kind}`;
      let oldAssetUrl = '';
      const results = [];

      for (const password of ['open sesame', 'new secret']) {
        if (password === 'new secret') {
          await app.update({ password: await hash(password, 10) });
        }
        const { cookie, passwordToken } = await getPasswordTokenFromAppPage(password);
        const stylesheet = await request.get(path, {
          headers:
            host === 'app'
              ? { host: 'app.org.localhost', cookie }
              : { 'X-Appsemble-Password-Token': passwordToken },
        });
        const [, reference] = stylesheet.data.match(/url\(\s*["']?([^\s"')]+)["']?\s*\)/)!;
        const url = new URL(reference);
        const assetUrl = `${url.pathname}${url.search}`;
        const response = await request.get(assetUrl);
        results.push([stylesheet.status, response.status, response.data]);
        if (!oldAssetUrl) {
          oldAssetUrl = assetUrl;
        }
      }
      const revoked = await request.get(oldAssetUrl);

      expect([results, revoked.status]).toStrictEqual([
        [
          [200, 200, content],
          [200, 200, content],
        ],
        401,
      ]);
    },
  );

  it('should serve the app content to organization members', async () => {
    const user = await createTestUser();
    await OrganizationMember.create({
      OrganizationId: 'org',
      UserId: user.id,
      role: PredefinedOrganizationRole.Member,
    });
    authorizeStudio();

    const response = await request.get(`/api/apps/${app.id}`);

    expect(response.status).toBe(200);
  });

  it('should keep the store listing of a password protected app reachable', async () => {
    const response = await request.get(`/api/apps/${app.id}/icon`);

    expect(response.status).toBe(200);
  });

  it('should serve the app content to anyone without password protection', async () => {
    await app.update({ password: null });

    const response = await request.get(`/api/apps/${app.id}`);

    expect(response.status).toBe(200);
  });
});
