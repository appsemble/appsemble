import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  Organization,
  OrganizationMember,
  Group,
  GroupInvite,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeApp, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

useTestDatabase(import.meta);

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

  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });
});

describe('acceptAppGroupInvite', () => {
  beforeEach(() => {
    authorizeApp(app);
  });

  it('should respond with 404 if no group invite was found', async () => {
    const response = await request.post(`/api/apps/${app.id}/group/invites`, { code: 'invalid' });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "No invite found for code: invalid",
        "statusCode": 404,
      }
    `);
  });

  it('should create a group member and destroy the invite', async () => {
    const group = await Group.create({ name: 'Fooz', AppId: app.id });
    const invite = await GroupInvite.create({
      GroupId: group.id,
      key: 'super secret',
      email: 'test@example.com',
    });
    const response = await request.post(`/api/apps/${app.id}/group/invites`, {
      code: 'super secret',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "annotations": {},
        "id": 1,
        "name": "Fooz",
        "role": "member",
      }
    `);
    await expect(invite.reload()).rejects.toBeDefined();
  });
});
