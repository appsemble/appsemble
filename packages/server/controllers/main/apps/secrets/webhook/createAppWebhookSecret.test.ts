import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
let member: OrganizationMember;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('createAppWebhookSecret', () => {
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
        webhooks: {
          test: {
            schema: {
              type: 'object',
              properties: {
                foo: { type: 'string' },
              },
            },
            action: {
              type: 'log',
            },
          },
        },
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

  it('should create new app webhook secret', async () => {
    const response = await request.post(`/api/apps/${app.id}/secrets/webhook`, {
      name: 'Test webhook',
      webhookName: 'test',
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Test webhook",
      }
    `,
    );
  });

  it('should require the EditApps and EditAppSettings permissions', async () => {
    authorizeStudio();
    await member.update({ role: 'Member' });
    const response = await request.post(`/api/apps/${app.id}/secrets/webhook`, {
      name: 'Test webhook',
      webhookName: 'test',
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

  it('should require a webhookName', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/webhook`, {
      name: 'Test webhook',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Webhook name is required",
        "statusCode": 400,
      }
    `);
  });

  it('should require the webhook to be defined in the app', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/webhook`, {
      name: 'Test webhook',
      webhookName: 'non-existing',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Webhook does not exist in the app definition",
        "statusCode": 400,
      }
    `);
  });
});
