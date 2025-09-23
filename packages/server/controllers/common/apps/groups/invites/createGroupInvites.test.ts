import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
  User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeAppMember, createTestUser } from '../../../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('createGroupInvites', () => {
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
      email: user.primaryEmail,
      userId: user.id,
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
    const response = await request.post(`/api/apps/${app.id}/groups/83/invites`, [
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
    const { Group, GroupMember } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Reader' });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites`, [
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
    const { Group, GroupMember } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Manager' });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites`, [
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
      appId: app.id,
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

  it('should create and send an invite email with the default app language if present', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl',
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
    const { Group, GroupMember } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Manager' });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites`, [
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
      appId: app.id,
      emailName: 'groupInvite',
      to: {
        email: 'newuser@example.com',
      },
      locale: 'nl',
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'null',
        groupName: 'A',
      },
    });
  });

  it('should create and send an invite email with the locale of the user if present', async () => {
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

    const newUser = await User.create({
      primaryEmail: 'newuser@example.com',
      locale: 'en',
      timezone: 'Europe/Amsterdam',
      name: 'John Doe',
    });

    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    const { Group, GroupMember } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Manager' });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites`, [
      {
        email: newUser.primaryEmail,
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
      appId: app.id,
      emailName: 'groupInvite',
      to: {
        email: 'newuser@example.com',
        name: 'John Doe',
      },
      locale: 'en',
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'John Doe',
        groupName: 'A',
      },
    });
  });

  it('should create and send an invite email prioritizing the locale of the user', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl',
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

    const newUser = await User.create({
      primaryEmail: 'newuser@example.com',
      locale: 'en',
      timezone: 'Europe/Amsterdam',
      name: 'John Doe',
    });

    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    const { Group, GroupMember } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Manager' });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites`, [
      {
        email: newUser.primaryEmail,
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
      appId: app.id,
      emailName: 'groupInvite',
      to: {
        email: 'newuser@example.com',
        name: 'John Doe',
      },
      locale: 'en',
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'John Doe',
        groupName: 'A',
      },
    });
  });

  it('should throw for non existent app members if skipGroupInvites is set in the app', async () => {
    await app.update({
      skipGroupInvites: true,
      definition: {
        ...app.definition,
        defaultLanguage: 'nl',
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

    await appMember.update({ role: PredefinedAppRole.GroupsManager });

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
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "newuser@example.com is not a member of the app",
        "statusCode": 400,
      }
    `);

    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should skip sending emails if skipGroupInvites is set in the app', async () => {
    await app.update({
      skipGroupInvites: true,
      definition: {
        ...app.definition,
        defaultLanguage: 'nl',
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

    const am = await AppMember.create({
      email: 'existent-member@example.com',
      AppId: app.id,
      role: 'Reader',
    });

    await appMember.update({ role: PredefinedAppRole.GroupsManager });

    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    const group = await Group.create({ name: 'A', AppId: app.id });
    await GroupMember.create({ GroupId: group.id, AppMemberId: appMember.id, role: 'Manager' });
    const response = await request.post(`/api/groups/${group.id}/invites`, [
      {
        email: 'existent-member@example.com',
        role: 'GroupMember',
      },
    ]);

    expect(response.data).toStrictEqual([
      expect.objectContaining({
        email: 'existent-member@example.com',
        role: 'GroupMember',
        id: expect.any(String),
      }),
    ]);

    expect(await GroupMember.findOne({ where: { id: response.data[0].id } })).toStrictEqual(
      expect.objectContaining({
        GroupId: 1,
        AppMemberId: am.id,
        role: 'GroupMember',
      }),
    );

    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });
});
