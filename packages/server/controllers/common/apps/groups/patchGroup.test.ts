import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getAppDB,
  type Group,
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

describe('patchGroup', () => {
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

  it('should update the name of the group', async () => {
    const { Group } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/groups/${group.id}`, {
      name: 'B',
    });
    const responseB = await request.get<Group>(`/api/apps/${app.id}/groups/${group.id}`);

    expect(response).toMatchObject({ status: 200, data: { id: group.id, name: 'B' } });
    expect(responseB.data.name).toBe('B');
  });

  it('should update annotations', async () => {
    const { Group } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/groups/${group.id}`, {
      name: 'B',
      annotations: { testKey: 'foo' },
    });
    const responseB = await request.get(`/api/apps/${app.id}/groups/${group.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: { id: group.id, name: 'B', annotations: { testKey: 'foo' } },
    });
    expect(responseB.data).toMatchObject({
      id: group.id,
      name: 'B',
      annotations: { testKey: 'foo' },
    });
  });

  it('should not update without sufficient permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const { Group } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/groups/${group.id}`, {
      name: 'B',
    });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient app permissions.' },
    });
  });

  it('should not update a non-existent group', async () => {
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/groups/80000`, { name: 'B' });

    expect(response).toMatchObject({ status: 404, data: { message: 'Group not found' } });
  });

  it('should not update a group from another organization', async () => {
    const org = await Organization.create({
      id: 'testorganization2',
      name: 'Test Organization',
    });
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
      OrganizationId: org.id,
    });
    const { Group } = await getAppDB(appB.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/groups/${group.id}`, {
      name: 'B',
    });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Group not found' },
    });
  });
});
