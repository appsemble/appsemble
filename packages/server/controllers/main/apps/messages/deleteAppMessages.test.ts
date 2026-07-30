import { type AppServingCache, type AppServingCacheResult } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { options } from '../../../../options/options.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { appServingCache } from '../../../../utils/serverCache.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let app: App;
let user: User;

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

describe('deleteAppMessages', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.AppTranslator,
    });
    app = await App.create({
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      definition: {
        name: 'Test App',
        description: 'Description',
        pages: [],
      },
    });
  });

  afterEach(() => {
    options.appServingCache = appServingCache;
  });

  it('should delete existing messages', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { messageIds: { test: 'Test.' } },
    });
    await getDB().query('UPDATE "App" SET "updated" = :updated WHERE "id" = :appId', {
      replacements: { appId: app.id, updated: new Date(0) },
    });
    await app.reload();
    const previousUpdated = app.updated;

    const response = await request.delete(`/api/apps/${app.id}/messages/en`);
    await app.reload();

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.updated.getTime()).toBeGreaterThan(previousUpdated.getTime());
  });

  it('should refresh app-serving message cache after deleting app messages', async () => {
    authorizeStudio();
    options.appServingCache = createTestCache();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'nl',
      messages: { messageIds: { test: 'Test.' } },
    });

    const requestOptions = { headers: { host: 'test-app.testorganization.localhost' } };
    const firstResponse = await request.get('/', requestOptions);
    const secondResponse = await request.get('/', requestOptions);

    expect(firstResponse.headers['x-appsemble-messages-cache']).toBe('miss');
    expect(secondResponse.headers['x-appsemble-messages-cache']).toBe('hit');

    await request.delete(`/api/apps/${app.id}/messages/nl`);

    const thirdResponse = await request.get('/', requestOptions);

    expect(thirdResponse.headers['x-appsemble-messages-cache']).toBe('miss');
    expect(thirdResponse.data.data.locales).not.toContain('nl');
  });

  it('should return 404 when deleting non-existant messages', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/messages/en`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have messages for “en”",
        "statusCode": 404,
      }
    `);
  });
});
