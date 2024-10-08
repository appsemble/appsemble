import { PredefinedAppRole, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  Group,
  GroupMember,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestUser } from '../../../../utils/test/authorization.js';
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
    role: PredefinedOrganizationRole.Owner,
  });
});

describe('createGroupInvites', () => {
  let appMember: AppMember;

  beforeEach(async () => {
    appMember = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });

    authorizeAppMember(app, appMember);
  });

  it('should not allow to create an invite for a non existent group', async () => {
    await app.update({
      definition: {
        ...app.definition,
        security: {
          ...app.definition.security,
          groups: {
            ...app.definition.security,
            join: 'invite',
          },
        },
      },
    });
    const response = await request.post('/api/groups/83/invites', [
      {
        email: 'newuser@example.com',
        role: 'GroupMember',
      },
    ]);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Group 83 does not exist",
        "statusCode": 400,
      }
    `);
  });

  it('should allow only group managers to create a group invite if specified', async () => {
    await app.update({
      definition: {
        ...app.definition,
        security: {
          ...app.definition.security,
          roles: { GroupMember: {} },
          groups: {
            ...app.definition.security,
            join: 'invite',
            invite: ['GroupManager'],
          },
        },
      },
    });
    const group = await Group.create({ name: 'A', AppId: app.id });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id });
    const response = await request.post(`/api/groups/${group.id}/invites`, [
      {
        email: 'newuser@example.com',
        role: 'GroupMember',
      },
    ]);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App member does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should create and send an invite email', async () => {
    await app.update({
      definition: {
        ...app.definition,
        security: {
          ...app.definition.security,
          roles: {
            GroupMember: {
              permissions: ['$group:member:invite'],
            },
          },
          groups: {
            ...app.definition.security,
            join: 'invite',
            invite: ['GroupMember'],
          },
        },
      },
    });

    await appMember.update({
      role: PredefinedAppRole.GroupsManager,
    });

    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    const group = await Group.create({ name: 'A', AppId: app.id });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Manager' });
    const response = await request.post(`/api/groups/${group.id}/invites`, [
      {
        email: 'newuser@example.com',
        role: 'GroupMember',
      },
    ]);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "email": "newuser@example.com",
          "role": "GroupMember",
        },
      ]
    `);

    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'groupInvite',
      to: {
        email: 'newuser@example.com',
      },
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'null',
        groupName: 'A',
      },
    });
  });
});
