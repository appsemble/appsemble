import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';

import { App, AppMember, BlockVersion, Member, Organization, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let organization: Organization;
let clock: Clock;
let user: User;

function createDefaultApp(org: Organization): Promise<App> {
  return App.create({
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
    OrganizationId: org.id,
  });
}

beforeAll(createTestSchema('appmembers'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  clock = install();

  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });

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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({ UserId: user.id, AppId: app.id, role: 'Admin' });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: user.id,
          name: 'Test User',
          primaryEmail: 'test@example.com',
          role: 'Admin',
        },
      ],
    });
  });

  it('should include organization members with the default role if policy is not invite', async () => {
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
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
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

  it('should only return invited members if policy is set to invite', async () => {
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
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchObject({
      status: 200,
      data: [],
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
      OrganizationId: organization.id,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members/${user.id}`);
    const responseB = await request.get(`/api/apps/${app.id}/members/${userB.id}`);
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
      OrganizationId: organization.id,
    });

    const userB = await User.create();

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members/${user.id}`);
    const responseB = await request.get(`/api/apps/${app.id}/members/${userB.id}`);

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
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members/${user.id}`);

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
      OrganizationId: organization.id,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/members/${userB.id}`, {
      role: 'Admin',
    });
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
});

describe('registerMemberEmail', () => {
  it('should register valid email addresses', async () => {
    const app = await createDefaultApp(organization);
    const data = { email: 'test@example.com', password: 'password' };
    const response = await request.post(`/api/apps/${app.id}/member`, data);

    expect(response).toMatchObject({
      status: 201,
      data: {},
    });

    const member = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(member.password).not.toBe('password');
    expect(await compare(data.password, member.password)).toBe(true);
  });

  it('should accept a display name', async () => {
    const app = await createDefaultApp(organization);
    const data = { email: 'test@example.com', name: 'Me', password: 'password' };
    const response = await request.post(`/api/apps/${app.id}/member`, data);

    expect(response).toMatchObject({
      status: 201,
      data: {},
    });

    const member = await AppMember.findOne({ where: { email: 'test@example.com' } });
    expect(member.name).toBe('Me');
  });

  it('should not register invalid email addresses', async () => {
    const app = await createDefaultApp(organization);
    const response = await request.post(`/api/apps/${app.id}/member`, {
      email: 'foo',
      password: 'bar',
    });

    expect(response).toMatchObject({ status: 400 });
  });

  it('should not register duplicate email addresses', async () => {
    const app = await createDefaultApp(organization);

    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'User',
      email: 'test@example.com',
    });

    const response = await request.post(`/api/apps/${app.id}/member`, {
      email: 'test@example.com',
      password: 'password',
    });

    expect(response).toMatchObject({ status: 409 });
  });
});

describe('verifyMemberEmail', () => {
  it('should verify existing email addresses', async () => {
    const app = await createDefaultApp(organization);

    await request.post(`/api/apps/${app.id}/member`, {
      email: 'test@example.com',
      password: 'password',
    });
    const member = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(member.emailVerified).toBe(false);
    expect(member.emailKey).not.toBeNull();

    const response = await request.post(`/api/apps/${app.id}/member/verify`, {
      token: member.emailKey,
    });
    expect(response).toMatchObject({ status: 200 });

    await member.reload();
    expect(member.emailVerified).toBe(true);
    expect(member.emailKey).toBeNull();
  });

  it('should not verify empty or invalid keys', async () => {
    const app = await createDefaultApp(organization);

    const responseA = await request.post(`/api/apps/${app.id}/member/verify`);
    const responseB = await request.post(`/api/apps/${app.id}/member/verify`, { token: null });
    const responseC = await request.post(`/api/apps/${app.id}/member/verify`, {
      token: 'invalidkey',
    });

    expect(responseA).toMatchObject({ status: 415 });
    expect(responseB).toMatchObject({ status: 400 });
    expect(responseC).toMatchObject({ status: 404 });
  });
});

describe('requestMemberResetPassword', () => {
  it('should create a password reset token', async () => {
    const app = await createDefaultApp(organization);

    const data = { email: 'test@example.com', password: 'password' };
    await request.post(`/api/apps/${app.id}/member`, data);

    const responseA = await request.post(`/api/apps/${app.id}/member/reset/request`, {
      email: data.email,
    });

    const member = await AppMember.findOne({ where: { email: data.email } });
    const responseB = await request.post(`/api/apps/${app.id}/member/reset`, {
      token: member.resetKey,
      password: 'newPassword',
    });

    await member.reload();

    expect(responseA).toMatchObject({ status: 204 });
    expect(responseB).toMatchObject({ status: 204 });
    expect(await compare('newPassword', member.password)).toBe(true);
    expect(member.resetKey).toBeNull();
  });

  it('should not reveal existing emails', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(`/api/apps/${app.id}/member/reset/request`, {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchObject({ status: 204 });
  });
});

describe('resetMemberPassword', () => {
  it('should return not found when resetting using a non-existent token', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(`/api/apps/${app.id}/member/reset`, {
      token: 'idontexist',
      password: 'whatever',
    });

    expect(response).toMatchObject({ status: 404 });
  });
});
