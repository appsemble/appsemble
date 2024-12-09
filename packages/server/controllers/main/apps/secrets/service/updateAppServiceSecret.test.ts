import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppServiceSecret,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
let member: OrganizationMember;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('updateAppServiceSecret', () => {
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
          groups: {
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
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should update a single app service secret', async () => {
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });
    await AppServiceSecret.create({
      name: 'Test service',
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
        "ca": null,
        "id": 2,
        "identifier": "x-key",
        "name": "Test service",
        "scope": null,
        "tokenUrl": null,
        "urlPatterns": "https://example.com",
      }
    `);
  });

  it('should throw status 404 for unknown secrets', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/service/123`, {
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'custom-header',
      identifier: 'x-key',
      secret: 'g2a3ca7494c1aad9e5e56a6c3',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Cannot find the app service secret to update",
        "statusCode": 404,
      }
    `);
  });

  it('should throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.put('/api/apps/123/secrets/service/1', {
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'custom-header',
      identifier: 'x-key',
      secret: 'g2a3ca7494c1aad9e5e56a6c3',
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

  it('should require the EditApps and EditAppSettings permissions', async () => {
    authorizeStudio();
    await member.update({ role: 'Member' });
    const response = await request.put(`/api/apps/${app.id}/secrets/service/123`, {
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query-parameter',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });
});
