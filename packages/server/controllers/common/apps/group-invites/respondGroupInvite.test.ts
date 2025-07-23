import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('acceptAppGroupInvite', () => {
  let appMember: AppMember;

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
      role: PredefinedOrganizationRole.Owner,
    });

    const { AppMember } = await getAppDB(app.id);
    appMember = await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      email: user.primaryEmail,
      role: 'Manager',
    });
    authorizeAppMember(app, appMember);
  });

  it('should respond with 404 if no group invite was found', async () => {
    const response = await request.post(`/api/apps/${app.id}/group-invites/invalid/respond`, {
      response: false,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "This token is invalid",
        "statusCode": 404,
      }
    `);
  });

  it('should create a group member and destroy the invite', async () => {
    const { Group, GroupInvite } = await getAppDB(app.id);
    const group = await Group.create({ name: 'Fooz' });
    const invite = await GroupInvite.create({
      GroupId: group.id,
      key: 'super-secret',
      email: 'test@example.com',
    });
    const response = await request.post(`/api/apps/${app.id}/group-invites/super-secret/respond`, {
      response: true,
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    await expect(invite.reload()).rejects.toBeDefined();
  });
});
