import { type AppServingCache, type AppServingCacheResult } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMessages,
  BlockVersion,
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

describe('createAppMessages', () => {
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

  it('should accept valid requests', async () => {
    authorizeStudio();
    await getDB().query('UPDATE "App" SET "updated" = :updated WHERE "id" = :appId', {
      replacements: { appId: app.id, updated: new Date(0) },
    });
    await app.reload();
    const previousUpdated = app.updated;
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { messageIds: { test: 'Test.' } },
    });
    const translation = (await AppMessages.findOne({ where: { AppId: app.id, language: 'en' } }))!;
    await app.reload();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "language": "en",
        "messages": {
          "messageIds": {
            "test": "Test.",
          },
        },
      }
    `);
    expect(translation.messages).toStrictEqual({ messageIds: { test: 'Test.' } });
    expect(app.updated.getTime()).toBeGreaterThan(previousUpdated.getTime());
  });

  it('should accept arrays of objects as request body', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, [
      { language: 'en', messages: { messageIds: { test: 'Test' } } },
      { language: 'de', messages: { messageIds: { test: 'Test De' } } },
      { language: 'ru', messages: { messageIds: { test: 'Test Ru' } } },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        {
          "language": "en",
          "messages": {
            "messageIds": {
              "test": "Test",
            },
          },
        },
        {
          "language": "de",
          "messages": {
            "messageIds": {
              "test": "Test De",
            },
          },
        },
        {
          "language": "ru",
          "messages": {
            "messageIds": {
              "test": "Test Ru",
            },
          },
        },
      ]
    `);
    const translations = await AppMessages.findAll({
      where: { AppId: app.id },
      order: [['language', 'ASC']],
    });
    expect(translations).toMatchObject([
      { AppId: app.id, language: 'de', messages: { messageIds: { test: 'Test De' } } },
      { AppId: app.id, language: 'en', messages: { messageIds: { test: 'Test' } } },
      { AppId: app.id, language: 'ru', messages: { messageIds: { test: 'Test Ru' } } },
    ]);
  });

  it('should refresh app-serving message cache after adding app messages', async () => {
    authorizeStudio();
    options.appServingCache = createTestCache();

    const requestOptions = { headers: { host: 'test-app.testorganization.localhost' } };
    const firstResponse = await request.get('/', requestOptions);
    const secondResponse = await request.get('/', requestOptions);

    expect(firstResponse.headers['x-appsemble-messages-cache']).toBe('miss');
    expect(secondResponse.headers['x-appsemble-messages-cache']).toBe('hit');

    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'nl',
      messages: { messageIds: { test: 'Test.' } },
    });

    const thirdResponse = await request.get('/', requestOptions);

    expect(thirdResponse.headers['x-appsemble-messages-cache']).toBe('miss');
    expect(thirdResponse.data.data.locales).toContain('nl');
  });

  it('should validate language tags in array request body', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, [
      { language: 'en', messages: { messageIds: { test: 'Test' } } },
      { language: 'test', messages: { messageIds: { test: 'Test Ru' } } },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Language “test” is invalid",
        "statusCode": 400,
      }
    `);
    const translations = await AppMessages.findAll({ where: { AppId: app.id } });
    expect(translations).toStrictEqual([]);
  });

  it('should not accept invalid language tags', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'english',
      messages: { messageIds: { test: 'Test.' } },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Language “english” is invalid",
        "statusCode": 400,
      }
    `);
  });

  it('should validate app messages from request body', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { app: { name4: 'Test' } },
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Invalid key name4",
        "statusCode": 400,
      }
    `);
  });

  it('should validate app messages from array request body', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, [
      {
        language: 'nl',
        messages: { app: { name: 'Test' } },
      },
      {
        language: 'en',
        messages: { app: { name4: 'Test' } },
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Invalid key name4",
        "statusCode": 400,
      }
    `);
    const foundMessages = await AppMessages.findAll({
      where: { AppId: app.id },
    });
    expect(foundMessages).toStrictEqual([]);
  });

  it('should validate if the block is being used in the app', async () => {
    authorizeStudio();
    await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.0',
    });
    const response = await request.post(`/api/apps/${app.id}/messages`, [
      {
        language: 'en',
        messages: {
          app: { name: 'Test' },
          blocks: { '@testorganization/test': { '0.0.0': { test: 'Block Test' } } },
        },
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Invalid translation key: blocks.@testorganization/test
      This block is not used in the app",
        "statusCode": 400,
      }
    `);
    const foundMessages = await AppMessages.findAll({
      where: { AppId: app.id },
    });
    expect(foundMessages).toStrictEqual([]);
    await app.update({
      definition: {
        name: 'Test',
        description: 'Test description',
        pages: [
          { name: 'Test Page 1', blocks: [{ type: '@testorganization/test', version: '0.0.0' }] },
        ],
      },
    });
    const response2 = await request.post(`/api/apps/${app.id}/messages`, [
      {
        language: 'en',
        messages: {
          app: { name: 'Test' },
          blocks: { '@testorganization/test': { '0.0.0': { test: 'Block Test' } } },
        },
      },
    ]);
    expect(response2.status).toBe(201);
    const appMessages = await AppMessages.findAll();
    expect(appMessages).toStrictEqual([
      expect.objectContaining({
        messages: {
          app: { name: 'Test' },
          blocks: {
            '@testorganization/test': {
              '0.0.0': {
                test: 'Block Test',
              },
            },
          },
        },
      }),
    ]);
    const response3 = await request.post(`/api/apps/${app.id}/messages`, [
      {
        language: 'en',
        messages: {
          app: { name: 'Test' },
          blocks: { '@testorganization/test': { '0.0.1': { test: 'Block Test' } } },
        },
      },
    ]);
    expect(response3).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Invalid translation key: blocks.@testorganization/test.0.0.1
      This block version is not used in the app",
        "statusCode": 400,
      }
    `);
  });
});
