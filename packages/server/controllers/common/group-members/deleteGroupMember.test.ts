import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMember,
  Group,
  GroupMember,
  Organization,
  OrganizationMember,
  User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('deleteGroupMember', () => {
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

  it('should remove a group member from a group', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: PredefinedOrganizationRole.Member,
    });
    const group = await Group.create({ name: 'A', AppId: app.id });
    const appMember = await createTestAppMember(
      app.id,
      user.primaryEmail,
      PredefinedAppRole.GroupMembersManager,
    );
    const appMemberB = await AppMember.create({
      email: userB.primaryEmail,
      AppId: app.id,
      UserId: userB.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    const groupMember = await GroupMember.create({
      AppMemberId: appMemberB.id,
      GroupId: group.id,
      role: PredefinedAppRole.Member,
    });

    authorizeAppMember(app, appMember);
    const response = await request.delete(`/api/group-members/${groupMember.id}`);
    expect(response.status).toBe(204);
  });

  it('should remove a group member from a group if the user has the manager role', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: PredefinedOrganizationRole.Member,
    });
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id, OrganizationId: app.OrganizationId } },
    );
    const group = await Group.create({ name: 'A', AppId: app.id });
    const appMember1 = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    const appMember2 = await AppMember.create({
      email: userB.primaryEmail,
      AppId: app.id,
      UserId: userB.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    await GroupMember.create({
      AppMemberId: appMember1.id,
      GroupId: group.id,
      role: 'GroupMembersManager',
    });
    const groupMember = await GroupMember.create({
      AppMemberId: appMember2.id,
      GroupId: group.id,
      role: 'Member',
    });

    authorizeAppMember(app, appMember1);
    const response = await request.delete(
      `/api/group-members/${groupMember.id}?selectedGroupId=${group.id}`,
    );
    expect(response.status).toBe(204);
  });

  it('should not remove a group member from a group if the user has insufficient permissions', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: PredefinedOrganizationRole.Member,
    });
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const group = await Group.create({ name: 'A', AppId: app.id });
    const appMember = await createTestAppMember(
      app.id,
      user.primaryEmail,
      PredefinedAppRole.Member,
    );
    const appMemberB = await AppMember.create({
      email: userB.primaryEmail,
      AppId: app.id,
      UserId: userB.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    const groupMember = await GroupMember.create({
      AppMemberId: appMemberB.id,
      GroupId: group.id,
      role: PredefinedAppRole.Member,
    });

    authorizeAppMember(app, appMember);
    const response = await request.delete(`/api/group-members/${groupMember.id}`);
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'App member does not have sufficient app permissions.' },
    });
  });

  it('should not remove a member who isn’t part of the group', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    const member = await AppMember.create({
      email: userB.primaryEmail,
      AppId: app.id,
      UserId: userB.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: PredefinedOrganizationRole.Member,
    });
    await Group.create({ name: 'A', AppId: app.id });

    authorizeAppMember(app, member);
    const response = await request.delete(`/api/group-members/${userB.id}`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Group member not found.' },
    });
  });
});
