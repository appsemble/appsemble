import { type AppServingCache, type AppServingCacheResult } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember } from '../../../../../models/index.js';
import { options } from '../../../../../options/options.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { appServingCache } from '../../../../../utils/serverCache.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;

function createTestCache(): AppServingCache {
  const store = new Map<string, unknown>();

  return {
    get: <T>(key: string): Promise<AppServingCacheResult<T>> =>
      Promise.resolve(
        store.has(key)
          ? { status: 'hit' as const, value: store.get(key) as T }
          : { status: 'miss' as const },
      ),
    set<T>(key: string, value: T) {
      store.set(key, value);
      return Promise.resolve('miss' as const);
    },
  };
}

function parseSettingsLogins(settings: string): unknown[] {
  const json = settings.slice('<script>window.settings='.length, -'</script>'.length);
  return (JSON.parse(json) as { logins: unknown[] }).logins;
}

describe('createAppOAuth2Secret', () => {
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
      path: 'test-app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {
        security: {
          default: {
            role: 'Test',
            policy: 'everyone',
          },
          roles: { Manager: {}, Test: {} },
        },
      },
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterEach(() => {
    options.appServingCache = appServingCache;
  });

  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  afterAll(() => {
    vi.useRealTimers();
  });

  it('should be possible to create an app secret', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://example.com/oauth/authorize",
        "clientId": "example_client_id",
        "clientSecret": "example_client_secret",
        "icon": "example",
        "id": 1,
        "name": "Example",
        "scope": "email openid profile",
        "tokenUrl": "https://example.com/oauth/token",
        "userInfoUrl": "https://example.com/oauth/userinfo",
      }
    `);
  });

  it('should refresh app-serving settings after creating an OAuth2 secret', async () => {
    authorizeStudio();
    options.appServingCache = createTestCache();
    const requestOptions = { headers: { host: 'test-app.testorganization.localhost' } };

    const firstResponse = await request.get('/', requestOptions);
    const secondResponse = await request.get('/', requestOptions);

    expect(firstResponse.headers['x-appsemble-settings-cache']).toBe('miss');
    expect(secondResponse.headers['x-appsemble-settings-cache']).toBe('hit');
    expect(parseSettingsLogins(secondResponse.data.data.settings)).toStrictEqual([]);

    vi.setSystemTime(1000);
    await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });

    const thirdResponse = await request.get('/', requestOptions);

    expect(thirdResponse.headers['x-appsemble-settings-cache']).toBe('miss');
    expect(parseSettingsLogins(thirdResponse.data.data.settings)).toStrictEqual([
      { icon: 'example', id: 1, name: 'Example', type: 'oauth2' },
    ]);
  });

  it('should normalize role mappings when creating an app secret', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      roleMappings: [
        { group: ' /Managers ', role: 'Manager' },
        { group: '/Managers', role: 'Manager' },
      ],
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
    });

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      roleMappings: [{ group: '/Managers', role: 'Manager' }],
    });
  });

  it('should reject role mappings for unknown app roles', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      roleMappings: [{ group: '/Managers', role: 'Unknown' }],
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Role mapping 1 has unknown role 'Unknown'",
        "statusCode": 400,
      }
    `);
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/99999/secrets/oauth2', {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should require a login with Appsemble Studio', async () => {
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });
});
