import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, Organization, OrganizationMember } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';

let app: App;

async function getPasswordTokenFromAppPage(): Promise<string> {
  const login = await request.post('/', new URLSearchParams({ password: 'open sesame' }), {
    headers: { host: 'app.org.localhost' },
    maxRedirects: 0,
  });
  const { data } = await request.get<{ data: { settings: string } }>('/', {
    headers: {
      host: 'app.org.localhost',
      cookie: login.headers['set-cookie']!.map((cookie) => cookie.split(';')[0]).join('; '),
    },
  });
  return JSON.parse(
    data.data.settings.slice('<script>window.settings='.length, -'</script>'.length),
  ).passwordToken;
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

  it.each(['', '/messages/en', '/resources/note', '/assets/logo'])(
    'should refuse %s of a password protected app to anonymous visitors',
    async (path) => {
      const response = await request.get(`/api/apps/${app.id}${path}`);

      expect(response.status).toBe(401);
    },
  );

  it('should serve the app content with the password token from the app page', async () => {
    const passwordToken = await getPasswordTokenFromAppPage();

    const response = await request.get(`/api/apps/${app.id}`, {
      headers: { 'X-Appsemble-Password-Token': passwordToken },
    });

    expect(response).toMatchObject({ status: 200, data: { definition: { name: 'Test App' } } });
  });

  it('should serve URL loaded app content with the password token as query parameter', async () => {
    const passwordToken = await getPasswordTokenFromAppPage();

    const response = await request.get(`/api/apps/${app.id}`, { params: { passwordToken } });

    expect(response.status).toBe(200);
  });

  it('should refuse a password token after the password changes', async () => {
    const passwordToken = await getPasswordTokenFromAppPage();
    await app.update({ password: await hash('new secret', 10) });

    const response = await request.get(`/api/apps/${app.id}`, {
      headers: { 'X-Appsemble-Password-Token': passwordToken },
    });

    expect(response.status).toBe(401);
  });

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
