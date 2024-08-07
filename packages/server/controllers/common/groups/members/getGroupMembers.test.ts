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
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
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

describe('getGroupMembers', () => {
  it('should return an empty array', async () => {
    const group = await Group.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups/${group.id}/members`);

    expect(response).toMatchObject({ status: 200, data: [] });
  });

  it('should return a list of group members', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: 'Member',
    });

    const appMember = await AppMember.create({
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      AppId: app.id,
      role: '',
    });
    const appMemberB = await AppMember.create({
      UserId: userB.id,
      name: userB.name,
      email: userB.primaryEmail,
      AppId: app.id,
      timezone: 'Europe/Amsterdam',
      role: '',
    });
    const group = await Group.create({ name: 'A', AppId: app.id });
    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: appMember.id,
      role: 'Manager',
    });
    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: appMemberB.id,
      role: 'Member',
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups/${group.id}/members`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: appMember.id,
          name: appMember.name,
          primaryEmail: appMember.email,
          role: 'Manager',
        },
        {
          id: appMemberB.id,
          name: appMemberB.name,
          primaryEmail: appMemberB.email,
          role: 'Member',
        },
      ],
    });
  });

  it('should not fetch members of non-existent groups', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups/80000/members`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Group not found.' },
    });
  });
});
