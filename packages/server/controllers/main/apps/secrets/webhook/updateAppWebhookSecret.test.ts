import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppWebhookSecret,
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
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('updateAppWebhookSecret', () => {
  beforeAll(async () => {
    setArgv(argv);
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
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

  it('should update a single app webhook secret', async () => {
    await AppWebhookSecret.create({
      name: 'Test webhook',
      webhookName: 'test',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });
    const secret2 = await AppWebhookSecret.create({
      name: 'Test webhook',
      webhookName: 'test',
      secret: 'g2a3ca7494c1aad9e5e56a6c3',
      AppId: app.id,
    });

    const response = await request.put(`/api/apps/${app.id}/secrets/webhook/${secret2.id}`, {
      name: 'Test webhook updated',
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Test webhook updated",
        "webhookName": "test",
      }
    `,
    );
  });

  it('should not allow directly updating the secret', async () => {
    const secret = await AppWebhookSecret.create({
      name: 'Test webhook',
      webhookName: 'test',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });

    const response = await request.put(`/api/apps/${app.id}/secrets/webhook/${secret.id}`, {
      secret: 'g0024cba821834fea0a94763f',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Cannot update the secret directly",
        "statusCode": 401,
      }
    `);
  });

  it('should throw status 404 for unknown secrets', async () => {
    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/secrets/webhook/d9324ea0-7108-4116-aeb4-935bd67b51cd`,
      {
        name: 'Test webhook',
      },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Cannot find the app webhook secret to update",
        "statusCode": 404,
      }
    `);
  });

  it('should throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.put('/api/apps/123/secrets/webhook/test', {
      name: 'Test webhook',
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
    const response = await request.put(`/api/apps/${app.id}/secrets/webhook/test`, {
      name: 'Test webhook',
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
