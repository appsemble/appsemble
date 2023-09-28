import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, AppServiceSecret, Member, Organization, type User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;
let user: User;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv(argv);
  const server = await createServer({});
  await setTestApp(server);
});

beforeEach(async () => {
  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  vi.clearAllTimers();
  vi.setSystemTime(date);
  user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  app = await App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      security: {
        teams: {
          join: 'anyone',
          invite: [],
        },
        default: {
          role: 'Reader',
          policy: 'everyone',
        },
        roles: {
          Reader: {},
        },
      },
    },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: organization.id,
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  authorizeStudio();
});

afterAll(() => {
  vi.useRealTimers();
});

describe('addAppServiceSecret', () => {
  it('should add new app service secret', async () => {
    const response = await request.post(`/api/apps/${app.id}/secrets/service`, {
      serviceName: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query-parameter',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "authenticationMethod": "query-parameter",
        "id": 1,
        "identifier": "key",
        "serviceName": "Test service",
        "tokenUrl": null,
        "urlPatterns": "example.com",
      }
    `);
  });
});

describe('getAppServiceSecrets', () => {
  it('should get app service secrets', async () => {
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'basic',
      identifier: 'john_doe',
      secret: 'Strong_Password-123',
      AppId: app.id,
    });

    const response = await request.get(`/api/apps/${app.id}/secrets/service`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "authenticationMethod": "query",
          "id": 1,
          "identifier": "key",
          "tokenUrl": null,
          "urlPatterns": "example.com",
        },
        {
          "authenticationMethod": "basic",
          "id": 2,
          "identifier": "john_doe",
          "tokenUrl": null,
          "urlPatterns": "example.com",
        },
      ]
    `);
  });
});

describe('updateAppServiceSecret', () => {
  it('should update a single app service secret', async () => {
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'custom-header',
      identifier: 'x-key',
      secret: 'g2a3ca7494c1aad9e5e56a6c3',
      AppId: app.id,
    });

    const response = await request.put(`/api/apps/${app.id}/secrets/service/2`, {
      urlPatterns: 'https://example.com',
      authenticationMethod: 'cookie',
      secret: 'g0024cba821834fea0a94763f',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authenticationMethod": "cookie",
        "id": 2,
        "identifier": "x-key",
        "serviceName": "Test service",
        "tokenUrl": null,
        "urlPatterns": "https://example.com",
      }
    `);
  });
});

describe('deleteAppServiceSecret', () => {
  it('should delete a single app service secret', async () => {
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });

    const response = await request.delete(`/api/apps/${app.id}/secrets/service/1`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });
});
