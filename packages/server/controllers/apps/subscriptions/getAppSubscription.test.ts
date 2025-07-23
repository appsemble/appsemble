import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../utils/test/authorization.js';

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

describe('getAppSubscription', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.useFakeTimers();

    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should subscription statuses to resources', async () => {
    const app = await defaultApp(organization.id);
    const appMember = await createTestAppMember(app.id);

    const { AppSubscription, Resource } = await getAppDB(app.id);
    await AppSubscription.create({
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    const resource = await Resource.create({
      type: 'person',
      data: { foo: 'I am Foo.' },
    });

    authorizeAppMember(app, appMember);
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
