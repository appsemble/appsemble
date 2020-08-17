import FakeTimers from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppMember, BlockVersion, Member, Organization, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let organizationId: string;
let clock: FakeTimers.InstalledClock;
let user: User;

beforeAll(createTestSchema('appmembers'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  clock = FakeTimers.install();

  ({ authorization, user } = await testToken());
  ({ id: organizationId } = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  }));
  await Member.create({ OrganizationId: organizationId, UserId: user.id, role: 'Owner' });

  await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  await BlockVersion.create({
    name: 'test',
    version: '0.0.0',
    OrganizationId: 'appsemble',
    parameters: {
      properties: {
        foo: {
          type: 'number',
        },
      },
    },
  });
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getAppMembers', () => {
  it('should fetch app members', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
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
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    await AppMember.create({ UserId: user.id, AppId: app.id, role: 'Reader' });

    const response = await request.get(`/api/apps/${app.id}/members`, {
      headers: { authorization },
    });
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: user.id,
          name: 'Test User',
          primaryEmail: 'test@example.com',
          role: 'Reader',
        },
      ],
    });
  });
});

describe('getAppMember', () => {
  it('should return default app member role if policy is set to everyone', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
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
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });
    const response = await request.get(`/api/apps/${app.id}/members/${user.id}`, {
      headers: { authorization },
    });
    const responseB = await request.get(`/api/apps/${app.id}/members/${userB.id}`, {
      headers: { authorization },
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: user.id,
        name: 'Test User',
        primaryEmail: 'test@example.com',
        role: 'Reader',
      },
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: { id: userB.id, name: 'Foo', primaryEmail: 'foo@example.com', role: 'Reader' },
    });
  });

  it('should return a 404 on uninvited members if policy is set to organization', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'organization',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const userB = await User.create();

    const response = await request.get(`/api/apps/${app.id}/members/${user.id}`, {
      headers: { authorization },
    });
    const responseB = await request.get(`/api/apps/${app.id}/members/${userB.id}`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: user.id,
        name: user.name,
        primaryEmail: user.primaryEmail,
        role: 'Reader',
      },
    });

    expect(responseB).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        statusCode: 404,
        message: 'User is not a member of the organization.',
      },
    });
  });

  it('should return a 404 on uninvited organization members if policy is set to invite', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'invite',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const response = await request.get(`/api/apps/${app.id}/members/${user.id}`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        statusCode: 404,
        message: 'User is not a member of the app.',
      },
    });
  });
});

describe('setAppMember', () => {
  it('should add app members', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });

    const response = await request.post(
      `/api/apps/${app.id}/members/${userB.id}`,
      { role: 'Admin' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'foo@example.com',
        role: 'Admin',
      },
    });
  });

  it('should remove app members if role is default', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });
    await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Admin' });

    const response = await request.post(
      `/api/apps/${app.id}/members/${userB.id}`,
      { role: 'Reader' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'foo@example.com',
        role: 'Reader',
      },
    });

    const responseB = await request.get(`/api/apps/${app.id}/members`, {
      headers: { authorization },
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should remove app members if role is default with invite policy', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'invite',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });
    await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Admin' });

    const response = await request.post(
      `/api/apps/${app.id}/members/${userB.id}`,
      { role: 'Reader' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'foo@example.com',
        role: 'Reader',
      },
    });

    const responseB = await request.get(`/api/apps/${app.id}/members`, {
      headers: { authorization },
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: [
        {
          id: userB.id,
          name: 'Foo',
          primaryEmail: 'foo@example.com',
          role: 'Reader',
        },
      ],
    });
  });
});
