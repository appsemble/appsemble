import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  BlockVersion,
  Organization,
  OrganizationMember,
  User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeApp, createTestUser } from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  vi.clearAllTimers();
  vi.setSystemTime(0);
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });

  await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  await BlockVersion.create({
    name: 'test',
    version: '0.0.0',
    OrganizationId: 'appsemble',
    parameters: {
      properties: {
        type: 'object',
        foo: {
          type: 'number',
        },
      },
    },
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe('getAppMembersByRoles', () => {
  it('should fetch app members by supported roles', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Admin',
            policy: 'everyone',
          },
          roles: {
            Role1: {},
            Role2: {},
            Role3: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Test Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
      properties: {},
    });

    const user1 = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember1 = await AppMember.create({
      UserId: user1.id,
      AppId: app.id,
      name: 'Test Member 1',
      email: 'role1@gmail.com',
      role: 'Role1',
      properties: {},
    });

    const user2 = await User.create({
      id: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember2 = await AppMember.create({
      UserId: user2.id,
      AppId: app.id,
      name: 'Test Member 2',
      email: 'role2@gmail.com',
      role: 'Role2',
      properties: {},
    });

    authorizeApp(app);
    const { data } = await request.get(`/api/apps/${app.id}/members?roles=Role1,Role2`);

    expect(data).toStrictEqual([
      {
        userId: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
        name: 'Test Member 2',
        primaryEmail: 'role2@gmail.com',
        properties: {},
        memberId: appMember2.id,
        role: 'Role2',
      },
      {
        userId: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
        name: 'Test Member 1',
        primaryEmail: 'role1@gmail.com',
        properties: {},
        memberId: appMember1.id,
        role: 'Role1',
      },
    ]);
  });

  it('should fetch all app members except the default role when provided with unsupported roles', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Admin',
            policy: 'everyone',
          },
          roles: {
            Role1: {},
            Role2: {},
            Role3: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Test Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
      properties: {},
    });

    const user1 = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember1 = await AppMember.create({
      UserId: user1.id,
      AppId: app.id,
      name: 'Test Member 1',
      email: 'role1@gmail.com',
      role: 'Role1',
      properties: {},
    });

    const user2 = await User.create({
      id: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember2 = await AppMember.create({
      UserId: user2.id,
      AppId: app.id,
      name: 'Test Member 2',
      email: 'role2@gmail.com',
      role: 'Role2',
      properties: {},
    });

    const user3 = await User.create({
      id: '5659cad5-7618-4a74-b03d-691d97ba6461',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember3 = await AppMember.create({
      UserId: user3.id,
      AppId: app.id,
      name: 'Test Member 3',
      email: 'role3@gmail.com',
      role: 'Role3',
      properties: {},
    });

    authorizeApp(app);
    const { data } = await request.get(`/api/apps/${app.id}/members?roles=`);

    expect(data).toStrictEqual([
      {
        userId: '5659cad5-7618-4a74-b03d-691d97ba6461',
        name: 'Test Member 3',
        primaryEmail: 'role3@gmail.com',
        properties: {},
        role: 'Role3',
        memberId: appMember3.id,
      },
      {
        userId: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
        name: 'Test Member 2',
        primaryEmail: 'role2@gmail.com',
        properties: {},
        role: 'Role2',
        memberId: appMember2.id,
      },
      {
        userId: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
        name: 'Test Member 1',
        primaryEmail: 'role1@gmail.com',
        properties: {},
        role: 'Role1',
        memberId: appMember1.id,
      },
    ]);
  });
});
