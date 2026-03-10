import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('createAppInvite', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
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
      OrganizationId: organization.id,
    });

    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should throw if the app does not exist', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id + 5}/invites`, [
      {
        email: 'test2@example.com',
        role: 'Reader',
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

  it('should throw if the app does not have a security definition', async () => {
    authorizeStudio();
    await app.update({
      definition: {
        name: 'Test App',
        pages: [],
      },
    });

    const response = await request.post(`/api/apps/${app.id}/invites`, [
      {
        email: 'test2@example.com',
        role: 'Reader',
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App does not have a security definition.",
        "statusCode": 403,
      }
    `);
  });

  it('should throw if invite contains an invalid role', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/invites`, [
      {
        email: 'test2@example.com',
        role: 'invalid',
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Role not allowed.",
        "statusCode": 403,
      }
    `);
  });

  it('should throw if invited users are already in the app', async () => {
    authorizeStudio();
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      email: 'test2@example.com',
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    const response = await request.post(`/api/apps/${app.id}/invites`, [
      {
        email: 'test2@example.com',
        role: 'invalid',
      },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Role not allowed.",
        "statusCode": 403,
      }
    `);
  });

  it('should create new app invites', async () => {
    authorizeStudio();
    const { status } = await request.post(`/api/apps/${app.id}/invites`, [
      {
        email: 'test@example.com',
        role: 'Reader',
      },
      {
        email: 'test2@example.com',
        role: 'Reader',
      },
    ]);
    expect(status).toBe(200);
    const { AppInvite } = await getAppDB(app.id);
    const invites = await AppInvite.findAll();
    expect(invites.map((invite) => invite.dataValues)).toStrictEqual([
      expect.objectContaining({
        email: 'test@example.com',
        role: 'Reader',
      }),
      expect.objectContaining({
        email: 'test2@example.com',
        role: 'Reader',
      }),
    ]);
  });
});
