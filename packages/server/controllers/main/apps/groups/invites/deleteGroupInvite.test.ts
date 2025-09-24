import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  type Group,
  Organization,
  OrganizationMember,
  User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
let organization: Organization;
let group: Group;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('deleteGroupInvite', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(date);
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
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const { Group } = await getAppDB(app.id);
    group = await Group.create({
      name: 'Test Group',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.AppGroupManager,
    });
    authorizeStudio();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should delete a single group invite', async () => {
    const { GroupInvite } = await getAppDB(app.id);
    await GroupInvite.create({
      GroupId: group.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    const response = await request.delete(`/api/apps/${app.id}/groups/${group.id}/invites`, {
      data: { email: 'test@example.com' },
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should throw status 404 for unknown invites', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/groups/${app.id}/invites`, {
      data: { email: 'test@example.com' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "This invite does not exist",
        "statusCode": 404,
      }
    `);
  });

  it('should check for organization member permissions', async () => {
    const { GroupInvite } = await getAppDB(app.id);
    await GroupInvite.create({
      GroupId: group.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    const unauthorizedUser = await User.create({
      name: 'Test User',
      primaryEmail: 'user@example.com',
      timezone: 'Europe/Amsterdam',
    });

    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: unauthorizedUser.id,
      role: PredefinedOrganizationRole.Member,
    });

    authorizeStudio(unauthorizedUser);

    const response = await request.delete(`/api/apps/${app.id}/groups/${group.id}/invites`, {
      data: { email: 'test@example.com' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });
});
