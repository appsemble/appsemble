import { request, setTestApp } from 'axios-test-instance';

import {
  App,
  AppSubscription,
  Member,
  Organization,
  Resource,
  ResourceSubscription,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeApp, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

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

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  import.meta.jest.useFakeTimers({ now: 0 });

  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

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

    authorizeApp(app);
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

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "subscriptions": {
            "1": {
              "delete": false,
              "update": true,
            },
          },
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
  });

  it('should 404 on non-existent subscriptions', async () => {
    const app = await defaultApp(organization.id);
    const response = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Subscription not found",
        "statusCode": 404,
      }
    `);
  });
});

describe('addSubscription', () => {
  it('should subscribe to apps', async () => {
    const app = await defaultApp(organization.id);

    authorizeApp(app);
    const response = await request.post(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      keys: { p256dh: 'abc', auth: 'def' },
    });

    const subscription = await AppSubscription.findOne({
      where: { endpoint: 'https://example.com' },
      raw: true,
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(subscription).toMatchObject({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
      AppId: app.id,
      UserId: user.id,
      created: new Date(),
      updated: new Date(),
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

    authorizeApp(app);
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

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": true,
          "delete": false,
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
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

    authorizeApp(app);
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

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "subscriptions": {
            "1": {
              "delete": false,
              "update": true,
            },
          },
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
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

    authorizeApp(app);
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
      value: false,
    });
    const responseB = await request.get(`/api/apps/${app.id}/subscriptions`, {
      params: { endpoint: 'https://example.com' },
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
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

    authorizeApp(app);
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

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "subscriptions": {
            "1": {
              "delete": false,
              "update": true,
            },
          },
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
  });

  it('should toggle resource type subscriptions if value isn’t set', async () => {
    const app = await defaultApp(organization.id);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    authorizeApp(app);
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

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": true,
          "delete": false,
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);

    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
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

    authorizeApp(app);
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

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "subscriptions": {
            "1": {
              "delete": false,
              "update": true,
            },
          },
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);

    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "person": {
          "create": false,
          "delete": false,
          "update": false,
        },
        "pet": {
          "create": false,
          "delete": false,
          "update": false,
        },
      }
    `);
  });

  it('should 404 on non-existent subscriptions', async () => {
    const app = await defaultApp(organization.id);
    const response = await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'person',
      action: 'create',
      value: true,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Subscription not found",
        "statusCode": 404,
      }
    `);
  });
});
