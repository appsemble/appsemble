/**
 * These tests use real sockets, because axios-mock-adapter intercepts requests before the HTTP
 * agents that enforce SSRF protection are invoked.
 */
import { createServer as createHttpServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import { App, getAppDB, Organization } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { countConnections } from '../../../../../utils/test/countConnections.js';

async function verify(tokenUrl: string, userInfoUrl: string): Promise<number> {
  const app = await App.create({
    OrganizationId: 'org',
    vapidPublicKey: '',
    vapidPrivateKey: '',
    definition: {},
    path: 'test-app',
  });
  const { AppOAuth2Secret } = await getAppDB(app.id);
  const secret = await AppOAuth2Secret.create({
    authorizationUrl: 'https://example.com/oauth/authorize',
    clientId: 'id',
    clientSecret: 'secret',
    icon: 'example',
    name: 'repro',
    scope: 'email',
    tokenUrl,
    userInfoUrl,
  });
  const { status } = await request.post(
    `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
    {
      code: 'c',
      redirectUri: 'http://test-app.org.localhost',
      scope: 'email',
      timezone: 'Europe/Amsterdam',
    },
    { headers: { referer: 'http://localhost' } },
  );
  return status;
}

describe('verifyAppOAuth2SecretCode SSRF protection', () => {
  beforeEach(async () => {
    vi.stubEnv('VITEST_CONF_ALLOW_PRIVATE_IP_PROXY', '');
    setArgv({ host: 'http://localhost', secret: 'test' });
    await setTestApp(await createServer());
    await Organization.create({ id: 'org' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['127.0.0.1', 'localhost'])(
    'should not connect to a token endpoint at %s',
    async (hostname) => {
      const target = await countConnections();

      const status = await verify(
        `http://${hostname}:${target.port}/token`,
        `http://${hostname}:${target.port}/userinfo`,
      );

      expect(status).toBeGreaterThanOrEqual(400);
      expect(target.connections).toBe(0);
    },
  );

  it('should not connect to a user info endpoint at a private address', async () => {
    const target = await countConnections();
    let tokenRequests = 0;
    const tokenServer = createHttpServer((req, res) => {
      tokenRequests += 1;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ access_token: 'opaque', token_type: 'bearer' }));
    });
    onTestFinished(() => {
      tokenServer.close();
    });
    await new Promise<void>((resolve) => {
      tokenServer.listen(0, '127.0.0.2', resolve);
    });
    vi.stubEnv('SSRF_ALLOW_IP_ADDRESS_LIST', '127.0.0.2');

    const status = await verify(
      `http://127.0.0.2:${(tokenServer.address() as AddressInfo).port}/token`,
      `http://127.0.0.1:${target.port}/userinfo`,
    );

    expect(status).toBeGreaterThanOrEqual(400);
    expect(tokenRequests).toBe(1);
    expect(target.connections).toBe(0);
  });
});
