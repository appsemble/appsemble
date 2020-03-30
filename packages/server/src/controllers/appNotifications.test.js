import FakeTimers from '@sinonjs/fake-timers';
import { createInstance } from 'axios-test-instance';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

let App;
let Organization;
let BlockVersion;
let AppSubscription;
let db;
let request;
let server;
let authorization;
let organizationId;
let clock;
let user;

const defaultApp = (id) => ({
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
    resources: {
      person: {
        create: {
          hooks: {
            notification: {
              to: ['$author'],
              subscribe: 'both',
            },
          },
        },
      },
      pet: {
        update: {
          hooks: {
            notification: {
              subscribe: 'both',
            },
          },
        },
      },
    },
  },
  path: 'test-app',
  vapidPublicKey: 'a',
  vapidPrivateKey: 'b',
  OrganizationId: id,
});

beforeAll(async () => {
  db = await testSchema('apps');
  server = await createServer({ db, argv: { host: 'http://localhost', secret: 'test' } });
  ({ App, AppSubscription, BlockVersion, Organization } = db.models);
  request = await createInstance(server);
}, 10e3);

beforeEach(async () => {
  clock = FakeTimers.install();

  await truncate(db);
  ({ authorization, user } = await testToken(db));
  ({ id: organizationId } = await user.createOrganization(
    {
      id: 'testorganization',
      name: 'Test Organization',
    },
    { through: { role: 'Owner' } },
  ));

  await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  await BlockVersion.create({
    name: '@appsemble/test',
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

afterEach(() => {
  clock.uninstall();
});

afterAll(async () => {
  await request.close();
  await db.close();
});

describe('getNotification', () => {
  it('should subscription statuses to resources', async () => {
    const app = await App.create(defaultApp(organizationId));

    await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    const resource = await app.createResource({
      type: 'person',
      data: { foo: 'I am Foo.' },
    });

    await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      {
        endpoint: 'https://example.com',
        resource: 'person',
        resourceId: resource.id,
        action: 'update',
        value: true,
      },
      { headers: { authorization } },
    );

    const response = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
          subscriptions: { [resource.id]: { update: true, delete: false } },
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
  });

  it('should 404 on non-existent subscriptions', async () => {
    const app = await App.create(defaultApp(organizationId));
    const response = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Subscription not found',
      },
    });
  });
});

describe('addSubscription', () => {
  it('should subscribe to apps', async () => {
    const app = await App.create(defaultApp(organizationId));

    const response = await request.post(
      `/api/apps/${app.id}/subscriptions`,
      {
        endpoint: 'https://example.com',
        keys: { p256dh: 'abc', auth: 'def' },
      },
      { headers: { authorization } },
    );

    const subscription = await AppSubscription.findOne({
      where: { endpoint: 'https://example.com' },
      raw: true,
    });

    expect(response).toMatchObject({ status: 204, data: {} });
    expect(subscription).toMatchObject({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
      AppId: app.id,
      UserId: user.id,
      created: new Date(clock.now),
      updated: new Date(clock.now),
    });
  });
});

describe('updateSubscription', () => {
  it('should update resource type subscription settings', async () => {
    const app = await App.create(defaultApp(organizationId));
    await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    const response = await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'create', value: true },
      { headers: { authorization } },
    );

    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    const subscription = await AppSubscription.findOne({
      where: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchObject({ status: 204, data: {} });
    expect(responseB).toMatchObject({
      status: 200,
      data: {
        person: {
          create: true,
          update: false,
          delete: false,
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
    expect(subscription.UserId).toStrictEqual(user.id);
  });

  it('should update individual resource subscription settings', async () => {
    const app = await App.create(defaultApp(organizationId));
    await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const { id } = await app.createResource({ type: 'person', data: {} });

    const response = await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      {
        endpoint: 'https://example.com',
        resource: 'person',
        action: 'update',
        resourceId: id,
        value: true,
      },
      { headers: { authorization } },
    );

    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    const subscription = await AppSubscription.findOne({
      where: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchObject({ status: 204, data: {} });
    expect(responseB).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
          subscriptions: {
            [id]: { update: true, delete: false },
          },
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
    expect(subscription.UserId).toStrictEqual(user.id);
  });

  it('should remove resource type subscription settings if set to false', async () => {
    const app = await App.create(defaultApp(organizationId));
    const subscription = await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    await subscription.createResourceSubscription({ type: 'person', action: 'create' });

    const response = await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'create', value: false },
      { headers: { authorization } },
    );
    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchObject({ status: 204, data: {} });
    expect(responseB).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
  });

  it('should remove individual resource subscription settings if set to false', async () => {
    const app = await App.create(defaultApp(organizationId));
    const subscription = await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const { id } = await app.createResource({ type: 'person', data: {} });

    await subscription.createResourceSubscription({
      type: 'person',
      action: 'update',
      ResourceId: id,
    });

    const responseA = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });
    const response = await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      {
        endpoint: 'https://example.com',
        resource: 'person',
        action: 'update',
        resourceId: id,
        value: false,
      },
      { headers: { authorization } },
    );
    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchObject({ status: 204, data: {} });
    expect(responseA).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
          subscriptions: { [id]: { update: true, delete: false } },
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
  });

  it('should toggle resource type subscriptions if value isn’t set', async () => {
    const app = await App.create(defaultApp(organizationId));
    await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'create' },
      { headers: { authorization } },
    );
    const responseA = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'create' },
      { headers: { authorization } },
    );
    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(responseA).toMatchObject({
      status: 200,
      data: {
        person: {
          create: true,
          update: false,
          delete: false,
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });

    expect(responseB).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
  });

  it('should toggle individual resource subscriptions if value isn’t set', async () => {
    const app = await App.create(defaultApp(organizationId));
    await app.createAppSubscription({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const { id } = await app.createResource({ type: 'person', data: {} });

    await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'update', resourceId: id },
      { headers: { authorization } },
    );
    const responseA = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'update', resourceId: id },
      { headers: { authorization } },
    );
    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(responseA).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
          subscriptions: {
            [id]: { update: true, delete: false },
          },
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });

    expect(responseB).toMatchObject({
      status: 200,
      data: {
        person: {
          create: false,
          update: false,
          delete: false,
        },
        pet: {
          create: false,
          update: false,
          delete: false,
        },
      },
    });
  });

  it('should 404 on non-existent subscriptions', async () => {
    const app = await App.create(defaultApp(organizationId));
    const response = await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      { endpoint: 'https://example.com', resource: 'person', action: 'create', value: true },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Subscription not found',
      },
    });
  });
});
