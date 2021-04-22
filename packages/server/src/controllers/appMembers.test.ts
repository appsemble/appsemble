import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppMember, BlockVersion, Member, Organization, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let organization: Organization;
let clock: Clock;
let user: User;

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
      OrganizationId: organization.id,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });
    await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Admin' });

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/members/${userB.id}`, {
      role: 'Reader',
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'foo@example.com',
        role: 'Reader',
      },
    });

    const member = await AppMember.findOne({ where: { UserId: userB.id } });
    expect(member).toBeNull();
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
      OrganizationId: organization.id,
    });

    const userB = await User.create({ name: 'Foo', primaryEmail: 'foo@example.com' });
    await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Admin' });

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/members/${userB.id}`, {
      role: 'Reader',
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'foo@example.com',
        role: 'Reader',
      },
    });

    authorizeStudio();
    const responseB = await request.get(`/api/apps/${app.id}/members`);
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
