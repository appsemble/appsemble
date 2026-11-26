/**
 * These tests use a real provider socket, so the requests pass the same HTTP agents as a login.
 */
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import {
  authorizeStudio,
  createTestUser,
  unauthorize,
} from '../../../../../utils/test/authorization.js';
import {
  type OAuth2Provider,
  providerClientId,
  providerClientSecret,
  providerCode,
  providerUser,
  serveOAuth2Provider,
} from '../../../../../utils/test/oauth2Provider.js';

let app: App;
let provider: OAuth2Provider;

function testLogin(values: Record<string, unknown>): Promise<{ data: unknown; status: number }> {
  return request.post(`/api/apps/${app.id}/secrets/oauth2/test-login`, {
    ...provider,
    clientId: providerClientId,
    clientSecret: providerClientSecret,
    code: providerCode,
    scope: 'email openid',
    ...values,
  });
}

describe('testAppOAuth2SecretLogin', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    await setTestApp(await createServer());
    const user = await createTestUser();
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
      definition: { security: { roles: { Editor: {}, Manager: {} } } },
      path: 'test-app',
    });
    provider = await serveOAuth2Provider();
    authorizeStudio(user);
  });

  it('should show what a login reads without logging anyone in', async () => {
    const { data } = await testLogin({
      roleMappings: [
        { group: '/Appsemble/Managers', role: 'Manager' },
        { group: '/Appsemble/Editors', role: 'Editor' },
      ],
    });

    expect(data).toStrictEqual({
      idToken: { sub: providerUser.sub, email: providerUser.email },
      userInfo: providerUser,
      user: { ...providerUser, email_verified: false },
      roles: ['Manager'],
    });
    const { AppMember, AppOAuth2Authorization } = await getAppDB(app.id);
    expect(await AppMember.count()).toBe(0);
    expect(await AppOAuth2Authorization.count()).toBe(0);
  });

  it('should show that no role matched', async () => {
    const { data } = await testLogin({
      roleMappings: [{ group: '/Appsemble/Editors', role: 'Editor' }],
    });

    expect(data).toMatchObject({ roles: [] });
  });

  it('should report why the provider rejected the code', async () => {
    const { data } = await testLogin({ code: 'expired-code' });

    expect(data).toStrictEqual({
      error: {
        check: 'tokenUrl',
        reason: 'httpError',
        detail: 'HTTP 400: invalid_grant: Code not valid',
      },
    });
  });

  it('should require a Studio login', async () => {
    unauthorize();

    const { status } = await testLogin({});

    expect(status).toBe(401);
  });
});
