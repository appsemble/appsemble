import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;

describe('getAppOAuth2Secret', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(() => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
  });

  beforeEach(async () => {
    const user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {
        security: {
          default: {
            role: 'Test',
            policy: 'everyone',
          },
          roles: { Test: {} },
        },
      },
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return a partial OAuth2 secret', async () => {
    const { AppOAuth2Secret } = await getAppDB(app.id);
    const secret = await AppOAuth2Secret.create({
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    const response = await request.get(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://example.com/oauth/authorize",
        "clientId": "example_client_id",
        "scope": "email openid profile",
      }
    `);
  });
});
