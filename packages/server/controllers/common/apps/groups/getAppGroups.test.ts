import { PredefinedAppRole } from '@appsemble/lang-sdk';
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

describe('getGroups', () => {
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

  it('should return an empty array', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups`);

    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should return a list of groups', async () => {
    const { Group } = await getAppDB(app.id);
    const groupA = await Group.create({ name: 'A' });
    const groupB = await Group.create({ name: 'B' });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: groupA.id, name: groupA.name },
        { id: groupB.id, name: groupB.name },
      ],
    });
  });

  it('should include the role of the user', async () => {
    const { AppMember, Group, GroupMember } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Member,
    });
    const groupA = await Group.create({ name: 'A' });
    const groupB = await Group.create({ name: 'B' });
    const groupC = await Group.create({ name: 'C' });

    await GroupMember.bulkCreate([
      { role: PredefinedAppRole.Member, AppMemberId: appMember.id, GroupId: groupA.id },
      { role: PredefinedAppRole.GroupsManager, AppMemberId: appMember.id, GroupId: groupB.id },
    ]);

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/groups`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: groupA.id, name: groupA.name },
        { id: groupB.id, name: groupB.name },
        { id: groupC.id, name: groupC.name },
      ],
    });
  });
});
