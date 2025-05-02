import { PredefinedAppRole, PredefinedOrganizationRole } from '@appsemble/types';
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

describe('getGroup', () => {
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

  it('should return a group', async () => {
    const { AppMember, Group, GroupMember } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    const group = await Group.create({ name: 'A', AppId: app.id });
    await GroupMember.create({
      role: PredefinedAppRole.Member,
      AppMemberId: appMember.id,
      GroupId: group.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups/${group.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: { id: group.id, name: group.name },
    });
  });

  it('should not return a group that doesn’t exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups/80000`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Group not found' },
    });
  });

  it('should not return a group for another app', async () => {
    const { Group } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
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
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const userB = await createTestUser('newUser@example.com');
    const { AppMember: AppMemberB } = await getAppDB(appB.id);
    await AppMemberB.create({
      email: userB.primaryEmail,
      userId: user.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });

    authorizeStudio(userB);
    const response = await request.get(`/api/apps/${app.id}/groups/${group.id}`);

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient app permissions.' },
    });
  });
});
