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

describe('deleteAppMemberByEmail', () => {
  it('should delete another app member by email', async () => {
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
            Admin: {},
            Reader: {},
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
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
      timezone: 'Europe/Amsterdam',
    });

    const readerUser = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    await AppMember.create({
      UserId: readerUser.id,
      AppId: app.id,
      name: 'Reader',
      email: 'reader@gmail.com',
      role: 'Reader',
      properties: {},
      timezone: 'Europe/Amsterdam',
    });

    authorizeApp(app);
    await request.delete(`/api/apps/${app.id}/members/email/reader@gmail.com`);

    const readerAfterDeletion = await AppMember.findOne({
      where: {
        email: 'reader@gmail.com',
      },
    });

    expect(readerAfterDeletion).toBeNull();
  });

  it('should delete own account by email', async () => {
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
            Admin: {},
            Reader: {},
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
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
      timezone: 'Europe/Amsterdam',
    });

    authorizeApp(app);
    await request.delete(`/api/apps/${app.id}/members/email/admin@gmail.com`);

    const readerAfterDeletion = await AppMember.findOne({
      where: {
        email: 'admin@gmail.com',
      },
    });

    expect(readerAfterDeletion).toBeNull();
  });
});
