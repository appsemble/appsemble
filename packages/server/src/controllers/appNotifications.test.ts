import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import {
  App,
  AppSubscription,
  Member,
  Organization,
  Resource,
  ResourceSubscription,
  User,
} from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let clock: Clock;
let organization: Organization;
let user: User;

const defaultApp = (OrganizationId: string): Promise<App> =>
  App.create({
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
      pages: [{ name: '', blocks: [] }],
    },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId,
  });

beforeAll(createTestSchema('appnotifications'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

afterEach(truncate);

beforeEach(async () => {
  clock = install();

  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getSubscription', () => {
  it('should subscription statuses to resources', async () => {
    const app = await defaultApp(organization.id);

    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'person',
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      resourceId: resource.id,
      action: 'update',
      value: true,
    });

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
    const app = await defaultApp(organization.id);
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
    const app = await defaultApp(organization.id);

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      keys: { p256dh: 'abc', auth: 'def' },
    });

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
    const app = await defaultApp(organization.id);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
      value: true,
    });

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
    const app = await defaultApp(organization.id);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const { id } = await Resource.create({ AppId: app.id, type: 'person', data: {} });

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'update',
      resourceId: id,
      value: true,
    });

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
    const app = await defaultApp(organization.id);
    const subscription = await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    await ResourceSubscription.create({
      AppSubscriptionId: subscription.id,
      type: 'person',
      action: 'create',
    });

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
      value: false,
    });
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
    const app = await defaultApp(organization.id);
    const subscription = await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const { id } = await Resource.create({ AppId: app.id, type: 'person', data: {} });

    await ResourceSubscription.create({
      AppSubscriptionId: subscription.id,
      type: 'person',
      action: 'update',
      ResourceId: id,
    });

    const responseA = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'update',
      resourceId: id,
      value: false,
    });
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
    const app = await defaultApp(organization.id);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    authorizeStudio();
    await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
    });
    const responseA = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });
    await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
    });
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
    const app = await defaultApp(organization.id);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const { id } = await Resource.create({ AppId: app.id, type: 'person', data: {} });

    authorizeStudio();
    await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'update',
      resourceId: id,
    });
    const responseA = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'update',
      resourceId: id,
    });
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
    const app = await defaultApp(organization.id);
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
      value: true,
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
