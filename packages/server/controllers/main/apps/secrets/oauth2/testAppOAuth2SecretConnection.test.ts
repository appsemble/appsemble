/**
 * These tests use real sockets, because axios-mock-adapter intercepts requests before the HTTP
 * agents that enforce SSRF protection are invoked.
 */
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import {
  authorizeStudio,
  createTestUser,
  unauthorize,
} from '../../../../../utils/test/authorization.js';
import { countConnections } from '../../../../../utils/test/countConnections.js';
import {
  providerClientId,
  providerClientSecret,
  serveOAuth2Provider,
} from '../../../../../utils/test/oauth2Provider.js';

let app: App;
let user: User;

async function testConnection(values: Record<string, unknown>): Promise<unknown> {
  const { data } = await request.post(`/api/apps/${app.id}/secrets/oauth2/test-connection`, values);
  return data;
}

describe('testAppOAuth2SecretConnection', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    await setTestApp(await createServer());
    user = await createTestUser();
    await Organization.create({ id: 'org' });
    await OrganizationMember.create({
      OrganizationId: 'org',
      UserId: user.id,
      role: PredefinedOrganizationRole.Maintainer,
    });
    app = await App.create({
      OrganizationId: 'org',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: { security: { roles: { Manager: {} } } },
      path: 'test-app',
    });
    authorizeStudio(user);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should pass every check for a working provider', async () => {
    const provider = await serveOAuth2Provider();

    const checks = await testConnection({
      ...provider,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      scope: 'openid',
    });

    expect(checks).toStrictEqual([
      { check: 'authorizationUrl', status: 'pass', reason: 'reachable', detail: 'HTTP 200' },
      { check: 'tokenUrl', status: 'pass', reason: 'reachable', detail: 'HTTP 400' },
      {
        check: 'clientCredentials',
        status: 'pass',
        reason: 'accepted',
        detail: 'HTTP 400: invalid_grant: Code not valid',
      },
      { check: 'userInfoUrl', status: 'pass', reason: 'reachable', detail: 'HTTP 401' },
      {
        check: 'discovery',
        status: 'pass',
        reason: 'match',
        detail: provider.authorizationUrl.replace(
          'protocol/openid-connect/auth',
          '.well-known/openid-configuration',
        ),
      },
      { check: 'scope', status: 'skip', reason: 'noRoleMappings' },
    ]);
  });

  it('should report a client ID the provider does not know', async () => {
    const provider = await serveOAuth2Provider();

    const checks = await testConnection({
      ...provider,
      clientId: `${providerClientId}${providerClientId}`,
      clientSecret: providerClientSecret,
      scope: 'openid',
    });

    expect(checks).toContainEqual({
      check: 'clientCredentials',
      status: 'fail',
      reason: 'rejected',
      detail: 'HTTP 401: invalid_client: Invalid client credentials',
    });
  });

  it('should test with the stored client secret if the form omits it', async () => {
    const provider = await serveOAuth2Provider();
    const { AppOAuth2Secret } = await getAppDB(app.id);
    const secret = await AppOAuth2Secret.create({
      ...provider,
      clientId: 'stored-client',
      clientSecret: providerClientSecret,
      icon: 'key',
      name: 'Keycloak',
      scope: 'openid',
    });

    const checks = await testConnection({
      ...provider,
      id: secret.id,
      clientId: providerClientId,
      scope: 'openid',
    });

    expect(checks).toContainEqual(
      expect.objectContaining({ check: 'clientCredentials', reason: 'accepted' }),
    );
  });

  it('should not send the stored client secret to another token URL', async () => {
    const provider = await serveOAuth2Provider();
    const { AppOAuth2Secret } = await getAppDB(app.id);
    const secret = await AppOAuth2Secret.create({
      ...provider,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      icon: 'key',
      name: 'Keycloak',
      scope: 'openid',
    });
    const otherTokenServer = await countConnections();

    const { status } = await request.post(`/api/apps/${app.id}/secrets/oauth2/test-connection`, {
      ...provider,
      id: secret.id,
      clientId: providerClientId,
      scope: 'openid',
      tokenUrl: `http://127.0.0.1:${otherTokenServer.port}/token`,
    });

    expect(status).toBe(400);
    expect(otherTokenServer.connections).toBe(0);
  });

  it('should report other provider errors without the rest of the response', async () => {
    const provider = await serveOAuth2Provider({
      token: [
        400,
        { error: 'unauthorized_client', error_description: 'Not allowed', session: 'internal' },
      ],
    });

    const checks = await testConnection({
      ...provider,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      scope: 'openid',
    });

    expect(checks).toContainEqual({
      check: 'clientCredentials',
      status: 'warn',
      reason: 'unexpected',
      detail: 'HTTP 400: unauthorized_client: Not allowed',
    });
  });

  it('should report an untrusted certificate', async () => {
    const provider = await serveOAuth2Provider({ https: true });

    const checks = await testConnection({
      ...provider,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      scope: 'openid',
    });

    expect(checks).toContainEqual(
      expect.objectContaining({ check: 'tokenUrl', status: 'fail', reason: 'certificate' }),
    );
  });

  it('should not connect to a private address', async () => {
    vi.stubEnv('VITEST_CONF_ALLOW_PRIVATE_IP_PROXY', '');
    const target = await countConnections();
    const url = `http://127.0.0.1:${target.port}/realms/test/protocol/openid-connect`;

    const checks = await testConnection({
      authorizationUrl: `${url}/auth`,
      tokenUrl: `${url}/token`,
      userInfoUrl: `${url}/userinfo`,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      scope: 'openid',
    });

    expect(checks).toContainEqual(
      expect.objectContaining({ check: 'tokenUrl', status: 'fail', reason: 'blocked' }),
    );
    expect(target.connections).toBe(0);
  });

  it('should report endpoints which differ from the discovery document', async () => {
    const provider = await serveOAuth2Provider({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      discovery: { token_endpoint: 'https://sso.example/token', userinfo_endpoint: 'userinfo' },
    });

    const checks = await testConnection({
      ...provider,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      scope: 'openid',
    });

    expect(checks).toContainEqual({
      check: 'discovery',
      status: 'warn',
      reason: 'mismatch',
      detail: 'tokenUrl: https://sso.example/token\nuserInfoUrl: userinfo',
    });
  });

  it('should hint at the groups scope for role mappings', async () => {
    const provider = await serveOAuth2Provider();

    const checks = await testConnection({
      ...provider,
      clientId: providerClientId,
      clientSecret: providerClientSecret,
      roleMappings: [{ group: '/Appsemble/Managers', role: 'Manager' }],
      scope: 'email openid',
    });

    expect(checks).toContainEqual({ check: 'scope', status: 'warn', reason: 'groupsScopeMissing' });
  });

  it('should only let organization members who may update app secrets test them', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id } },
    );

    const { status } = await request.post(`/api/apps/${app.id}/secrets/oauth2/test-connection`, {
      id: 1,
    });

    expect(status).toBe(403);
  });

  it('should require a Studio login', async () => {
    unauthorize();

    const { status } = await request.post(`/api/apps/${app.id}/secrets/oauth2/test-connection`, {
      id: 1,
    });

    expect(status).toBe(401);
  });

  it('should limit how often a user tests', async () => {
    const responses = await Promise.all(
      Array.from({ length: 31 }, () =>
        request.post(`/api/apps/${app.id}/secrets/oauth2/test-connection`, {}),
      ),
    );

    expect(responses.filter(({ status }) => status === 429)).toHaveLength(1);
  });
});
