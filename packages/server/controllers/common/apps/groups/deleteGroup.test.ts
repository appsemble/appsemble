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

describe('deleteGroup', () => {
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

  it('should delete a group', async () => {
    const { Group } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/groups/${group.id}`);
    const responseB = await request.get(`/api/apps/${app.id}/groups`);

    expect(response.status).toBe(204);
    expect(responseB.data).toStrictEqual([]);
  });

  it('should not delete without sufficient permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const { Group } = await getAppDB(app.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/groups/${group.id}`);

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient app permissions.' },
    });
  });

  it('should not delete groups from other organizations', async () => {
    const orgB = await Organization.create({ id: 'appsemble', name: 'Appsemble' });
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
      OrganizationId: orgB.id,
    });
    const { Group } = await getAppDB(appB.id);
    const group = await Group.create({ name: 'A' });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/groups/${group.id}`);
    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Group not found' },
    });
  });
});
