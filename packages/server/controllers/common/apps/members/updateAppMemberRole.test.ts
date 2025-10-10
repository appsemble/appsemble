import { randomUUID } from 'node:crypto';

import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeStudio,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;
let appMember: AppMember;

describe('updateAppMemberRole', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    app = await App.create({
      definition: {
        name: 'Test App',
        description: 'Test description',
        security: {
          roles: {
            User: {
              permissions: [],
            },
            Admin: {
              permissions: ['$member:query'],
            },
          },
          default: {
            role: 'User',
          },
        },
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    appMember = await createTestAppMember(app.id);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should throw for non existent apps', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/55/app-members/${appMember.id}/role`, {
      role: 'User',
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

  it('should throw if the app member does not exist', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/app-members/${randomUUID()}/role`, {
      role: 'User',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App member not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not allow changing own role', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(`/api/apps/${app.id}/app-members/${appMember.id}/role`, {
      role: 'User',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Cannot use this endpoint to update your own role",
        "statusCode": 401,
      }
    `);
  });

  it('should throw for the invalid roles', async () => {
    authorizeAppMember(app, appMember);
    const appMember2 = await createTestAppMember(app.id, 'test2@example.com');
    const response = await request.put(`/api/apps/${app.id}/app-members/${appMember2.id}/role`, {
      role: 'invalid',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Role not allowed",
        "statusCode": 401,
      }
    `);
  });

  it('should throw if the app member does not have enough permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );
    const appMember2 = await createTestAppMember(app.id, 'test2@example.com');
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/app-members/${appMember2.id}/role`, {
      role: 'Admin',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should update the role', async () => {
    const appMember2 = await createTestAppMember(app.id, 'test2@example.com');
    await appMember.update({ role: PredefinedAppRole.Owner });
    authorizeAppMember(app, appMember);

    const response = await request.put(`/api/apps/${app.id}/app-members/${appMember2.id}/role`, {
      role: 'Admin',
    });
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      sub: appMember2.id,
      role: 'Admin',
    });
  });
});
