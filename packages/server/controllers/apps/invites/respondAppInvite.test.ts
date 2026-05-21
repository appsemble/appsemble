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
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

let app: App;
let organization: Organization;
let server: Koa;
let user: User;

describe('respondAppInvite', () => {
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
          default: {
            role: 'User',
            policy: 'invite',
          },
          roles: {
            User: {},
            Editor: {},
            Admin: {},
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

  it('should create a member with all invited roles', async () => {
    const { AppInvite, AppMember } = await getAppDB(app.id);
    await AppInvite.create({
      email: 'test@example.com',
      key: 'test-key',
      roles: ['User', 'Editor'],
    });

    const response = await request.post(`/api/apps/${app.id}/app-invites/test-key/respond`, {
      locale: 'en',
      password: 'supersecret',
      response: true,
      timezone: 'Europe/Amsterdam',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const appMember = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(appMember?.email).toBe('test@example.com');
    expect(appMember?.roles.toSorted()).toStrictEqual(['Editor', 'User']);
  });

  it('should merge invited roles into an existing member', async () => {
    const { AppInvite, AppMember } = await getAppDB(app.id);
    await AppInvite.create({
      email: 'test@example.com',
      key: 'test-key',
      roles: ['User', 'Editor'],
    });
    const existingAppMember = await AppMember.create({
      email: 'test@example.com',
      roles: ['Admin'],
      password: 'old-password',
      timezone: 'Europe/Amsterdam',
    });

    const response = await request.post(`/api/apps/${app.id}/app-invites/test-key/respond`, {
      locale: 'en',
      password: 'supersecret',
      response: true,
      timezone: 'Europe/Amsterdam',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    await existingAppMember.reload();

    expect(existingAppMember.roles.toSorted()).toStrictEqual(['Admin', 'Editor', 'User']);
  });
});
