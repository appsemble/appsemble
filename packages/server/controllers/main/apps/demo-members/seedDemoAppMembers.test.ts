import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;

describe('seedDemoAppMembers', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
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
        defaultPage: 'Test Page',
        security: {
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
      demoMode: true,
      OrganizationId: organization.id,
    });
  });

  it('should throw if the app is not found', async () => {
    await authorizeClientCredentials('apps:write');
    const response = await request.post('/api/apps/2/demo-members', [
      {
        email: 'test@example.com',
        role: 'Reader',
        name: 'Example Reader',
        timezone: 'Europe/Amsterdam',
      },
    ]);
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

  it('should throw if the request is not made from the CLI', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/demo-members`, [
      {
        email: 'test@example.com',
        role: 'Reader',
        name: 'Example Reader',
        timezone: 'Europe/Amsterdam',
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });

  it('should throw if the user does not have sufficient permissions', async () => {
    await OrganizationMember.update(
      {
        role: PredefinedOrganizationRole.Member,
      },
      {
        where: {
          UserId: user.id,
          OrganizationId: organization.id,
        },
      },
    );
    await authorizeClientCredentials('apps:write', user);
    const response = await request.post(`/api/apps/${app.id}/demo-members`, [
      {
        email: 'test@example.com',
        role: 'Reader',
        name: 'Example Reader',
        timezone: 'Europe/Amsterdam',
      },
    ]);
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

  it('should throw if the app is not in demo mode', async () => {
    await app.update({ demoMode: false });
    await authorizeClientCredentials('apps:write');
    const response = await request.post(`/api/apps/${app.id}/demo-members`, [
      {
        email: 'test@example.com',
        role: 'Reader',
        name: 'Example Reader',
        timezone: 'Europe/Amsterdam',
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App should be in demo mode",
        "statusCode": 403,
      }
    `);
  });

  it('should return the created demo app members', async () => {
    await authorizeClientCredentials('apps:write');
    const response = await request.post(`/api/apps/${app.id}/demo-members`, [
      {
        email: 'test@example.com',
        role: 'Reader',
        name: 'Example Reader',
        timezone: 'Europe/Amsterdam',
      },
      {
        email: 'test2@example.com',
        role: 'Reader',
        name: 'Example Reader 2',
        timezone: 'Europe/Amsterdam',
      },
      {
        email: 'test3@example.com',
        role: 'Reader',
        name: 'Example Reader 3',
        timezone: 'Europe/Amsterdam',
      },
      {
        email: 'test4@example.com',
        role: 'Reader',
        name: 'Example Reader 4',
        timezone: 'Europe/Amsterdam',
      },
    ]);
    expect(response.status).toBe(200);
  });
});
