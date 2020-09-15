import FakeTimers from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import webpush from 'web-push';

import { App, AppMember, AppSubscription, Member, Organization, Resource, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let organizationId: string;
let clock: FakeTimers.InstalledClock;
let user: User;
let originalSendNotification: typeof webpush.sendNotification;

const exampleApp = (orgId: string, path = 'test-app'): Promise<App> =>
  App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      resources: {
        testResource: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          create: {
            hooks: {
              notification: {
                subscribe: 'all',
                data: {
                  title: 'This is the title of a created testResource',
                  content: [
                    {
                      'string.format': {
                        template: 'This is the created resource {id}’s body: {foo}',
                        values: { id: [{ prop: 'id' }], foo: [{ prop: 'foo' }] },
                      },
                    },
                  ],
                },
              },
            },
          },
          update: {
            hooks: {
              notification: {
                subscribe: 'both',
              },
            },
          },
        },
        testResourceB: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
          },
          references: {
            testResourceId: {
              resource: 'testResource',
              create: {
                trigger: ['update'],
              },
            },
          },
        },
        testResourceAuthorOnly: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          query: { roles: ['$author'] },
        },
        secured: {
          schema: { type: 'object' },
          create: {
            roles: ['Admin'],
          },
          query: {
            roles: ['Reader'],
          },
        },
        testExpirableResource: {
          expires: '10m',
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
        },
      },
      security: {
        default: {
          role: 'Reader',
          policy: 'invite',
        },
        roles: {
          Reader: {},
          Admin: {
            inherits: ['Reader'],
          },
        },
      },
    },
    path,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: orgId,
  });

beforeAll(createTestSchema('resources'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
  originalSendNotification = webpush.sendNotification;
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  ({ id: organizationId } = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  }));
  await Member.create({ UserId: user.id, OrganizationId: organizationId, role: 'Maintainer' });
  clock = FakeTimers.install();
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(() => {
  webpush.sendNotification = originalSendNotification;
});

afterAll(closeTestSchema);

describe('getResourceById', () => {
  it('should be able to fetch a resource', async () => {
    const app = await exampleApp(organizationId);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: resource.id,
        foo: 'bar',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    });
  });

  it('should not be able to fetch a resources of a different app', async () => {
    const appA = await exampleApp(organizationId);
    const appB = await exampleApp(organizationId, 'app-b');

    const resource = await Resource.create({
      AppId: appA.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const responseA = await request.get(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
    );
    const responseB = await request.get(
      `/api/apps/${appB.id}/resources/testResourceB/${resource.id}`,
    );

    expect(responseA).toMatchObject({ status: 404 });
    expect(responseB).toMatchObject({ status: 404 });
  });

  it('should return the resource author when fetching a single resource if it has one', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      UserId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: resource.id,
        foo: 'foo',
        bar: 1,
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
        $author: { id: user.id, name: user.name },
      },
    });
  });

  it('should ignore id in the data fields', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { id: 23, foo: 'foo', bar: 1 },
      UserId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: resource.id,
        foo: 'foo',
        bar: 1,
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
        $author: { id: user.id, name: user.name },
      },
    });
  });

  it('should not fetch expired resources', async () => {
    const app = await exampleApp(organizationId);
    const {
      data: { id },
    } = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    const responseA = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    // The resource expires after 10 minutes.
    clock.tick(601e3);

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    expect(responseA).toMatchObject({
      status: 200,
      data: {
        foo: 'test',
      },
    });
    expect(responseB).toMatchObject({
      status: 404,
    });
  });
});

describe('queryResources', () => {
  it('should be able to fetch all resources of a type', async () => {
    const app = await exampleApp(organizationId);

    const resourceA = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const resourceB = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceA.id,
          foo: 'bar',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
        {
          id: resourceB.id,
          foo: 'baz',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should be possible to query resources as author', async () => {
    const app = await exampleApp(organizationId);
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    const userB = await User.create();
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Admin' });

    const resourceA = await Resource.create({
      AppId: app.id,
      UserId: user.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      UserId: userB.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceA.id,
          foo: 'bar',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should be able to limit the amount of resources', async () => {
    const app = await exampleApp(organizationId);

    const resourceA = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource?$top=1`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceA.id,
          foo: 'bar',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should be able to sort fetched resources', async () => {
    const app = await exampleApp(organizationId);

    const resourceA = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    clock.tick(20e3);
    const resourceB = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const responseA = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo asc`,
    );
    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo desc`,
    );
    const responseC = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created asc`,
    );
    const responseD = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created desc`,
    );

    expect(responseA).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceA.id,
          foo: 'bar',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
        {
          id: resourceB.id,
          foo: 'baz',
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
        },
      ],
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceB.id,
          foo: 'baz',
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
        },
        {
          id: resourceA.id,
          foo: 'bar',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
    expect(responseC).toMatchObject({ status: 200, data: responseA.data });
    expect(responseD).toMatchObject({ status: 200, data: responseB.data });
  });

  it('should be able to select fields when fetching resources', async () => {
    const app = await exampleApp(organizationId);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testResource?$select=id`);

    expect(response).toMatchObject({
      status: 200,
      data: [{ id: resource.id }],
    });
  });

  it('should be able to filter fields when fetching resources', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar' } });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource?$filter=foo eq 'foo'`,
    );

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resource.id,
          ...resource.data,
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should be able to filter multiple fields when fetching resources', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar', bar: 2 } });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource?$filter=substringof('oo', foo) and id le ${resource.id}`,
    );

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resource.id,
          ...resource.data,
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should be able to combine multiple functions when fetching resources', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    clock.tick(20e3);
    const resourceB = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource?$filter=substringof('oo', foo) or foo eq 'bar'&$orderby=$updated desc&$select=id,$created,$updated`,
    );

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceB.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
        },
        {
          id: resource.id,
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should return the resource author if it has one', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      UserId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resource.id,
          foo: 'foo',
          bar: 1,
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
          $author: { id: user.id, name: user.name },
        },
      ],
    });
  });

  it('should not fetch expired resources', async () => {
    const app = await exampleApp(organizationId);
    const {
      data: { id: idA },
    } = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });
    const {
      data: { id: idB },
    } = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'bar',
    });

    const responseA = await request.get(`/api/apps/${app.id}/resources/testExpirableResource`);

    // The resource A expires after 5 minutes.
    clock.tick(301e3);

    const responseB = await request.get(`/api/apps/${app.id}/resources/testExpirableResource`);

    expect(responseA).toMatchObject({
      status: 200,
      data: [
        { id: idA, foo: 'test', $expires: '1970-01-01T00:05:00.000Z' },
        { id: idB, foo: 'bar', $expires: '1970-01-01T00:10:00.000Z' },
      ],
    });
    expect(responseB.data).toStrictEqual([
      {
        id: idB,
        foo: 'bar',
        $clonable: false,
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:10:00.000Z',
      },
    ]);
  });
});

describe('createResource', () => {
  it('should be able to create a new resource', async () => {
    const app = await exampleApp(organizationId);

    const resource = { foo: 'bar' };
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchObject({
      status: 201,
      data: {
        foo: 'bar',
        id: expect.any(Number),
      },
    });
  });

  it('should validate resources', async () => {
    const app = await exampleApp(organizationId);

    const resource = {};
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          foo: {
            required: true,
          },
        },
      },
    });
  });

  it('should check if an app has a specific resource definition', async () => {
    const app = await exampleApp(organizationId);

    const response = await request.get(`/api/apps/${app.id}/resources/thisDoesNotExist`);
    expect(response).toMatchObject({
      status: 404,
      data: { message: 'App does not have resources called thisDoesNotExist' },
    });
  });

  it('should check if an app has any resource definitions', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });
    const response = await request.get(`/api/apps/${app.id}/resources/thisDoesNotExist`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'App does not have any resources defined' },
    });
  });

  it('should calculate resource expiration', async () => {
    const app = await exampleApp(organizationId);
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        foo: 'test',
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:10:00.000Z',
      },
    });
  });

  it('should set resource expiration', async () => {
    const app = await exampleApp(organizationId);
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        foo: 'test',
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:05:00.000Z',
      },
    });
  });

  it('should not set resource expiration if given date has already passed', async () => {
    // 10 minutes
    clock.tick(600e3);

    const app = await exampleApp(organizationId);
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        message: 'Expiration date has already passed.',
      },
    });
  });
});

describe('updateResource', () => {
  it('should be able to update an existing resource', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    clock.tick(20e3);

    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        foo: 'I am not Foo.',
        id: resource.id,
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:20.000Z',
      },
    });

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseB).toMatchObject({
      status: 200,
      data: {
        foo: 'I am not Foo.',
        id: resource.id,
      },
    });
  });

  it('should not be possible to update an existing resource through another resource', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceB/${resource.id}`,
      { foo: 'I am not Foo.' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 404 });
  });

  it('should not be possible to update an existing resource through another app', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await exampleApp(organizationId, 'app-b');

    const response = await request.put(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 404 });
  });

  it('should not be possible to update a non-existent resource', async () => {
    const app = await exampleApp(organizationId);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/0`,
      { foo: 'I am not Foo.' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Resource not found',
        statusCode: 404,
      },
    });
  });

  it('should validate resources', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { bar: 123 },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should set clonable if specified in the request', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.', $clonable: true },
      { headers: { authorization } },
    );

    await resource.reload();

    expect(response.status).toBe(200);
    expect(resource.clonable).toBe(true);
  });

  it('should set $expires', async () => {
    const app = await exampleApp(organizationId);
    const {
      data: { id },
    } = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    const responseA = await request.put(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
      {
        foo: 'updated',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    );
    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    expect(responseA).toMatchObject({
      status: 200,
      data: {
        foo: 'updated',
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    });

    expect(responseB).toMatchObject({
      status: 200,
      data: {
        foo: 'updated',
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    });
  });

  it('should not set $expires if the date has already passed', async () => {
    // 10 minutes
    clock.tick(600e3);

    const app = await exampleApp(organizationId);
    const {
      data: { id },
    } = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    const response = await request.put(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
      {
        foo: 'updated',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        message: 'Expiration date has already passed.',
      },
    });
  });
});

describe('deleteResource', () => {
  it('should be able to delete an existing resource', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const responseGetA = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetA).toMatchObject({
      status: 200,
      data: {
        foo: 'I am Foo.',
        id: resource.id,
      },
    });

    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 204 });

    const responseGetB = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetB).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Resource not found',
        statusCode: 404,
      },
    });
  });

  it('should not be able to delete a non-existent resource', async () => {
    const app = await exampleApp(organizationId);
    const response = await request.delete(`/api/apps/${app.id}/resources/testResource/0`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Resource not found',
        statusCode: 404,
      },
    });
  });

  it('should not be possible to delete an existing resource through another resource', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceB/${resource.id}`,
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 404 });

    const responseGet = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet).toMatchObject({
      status: 200,
      data: {
        foo: 'I am Foo.',
        id: resource.id,
      },
    });
  });

  it('should not be possible to delete an existing resource through another app', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await exampleApp(organizationId, 'app-b');
    const response = await request.delete(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 404 });

    const responseGet = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet).toMatchObject({
      status: 200,
      data: {
        foo: 'I am Foo.',
        id: resource.id,
      },
    });
  });
});

describe('verifyAppRole', () => {
  // The same logic gets applies to query, get, create, update, and delete.
  it('should return normally on secured actions if user is authenticated and has sufficient roles', async () => {
    const app = await exampleApp(organizationId);
    app.definition.resources.testResource.query = {
      roles: ['Reader'],
    };

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    const resourceA = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const resourceB = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: resourceA.id,
          foo: 'bar',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
        {
          id: resourceB.id,
          foo: 'baz',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });
  });

  it('should return normally on secured actions if user is the resource author', async () => {
    const app = await exampleApp(organizationId);
    app.definition.resources.testResource.get = {
      roles: ['Admin', '$author'],
    };

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      {
        headers: { authorization },
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: resource.id,
        foo: 'bar',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
        $author: {
          id: user.id,
          name: 'Test User',
        },
      },
    });
  });

  it('should return a 401 on unauthorized requests if roles are present', async () => {
    const app = await exampleApp(organizationId);

    const response = await request.get(`/api/apps/${app.id}/resources/secured`);

    expect(response).toMatchObject({
      status: 401,
      data: {
        error: 'Unauthorized',
        message: 'User is not logged in',
        statusCode: 401,
      },
    });
  });

  it('should throw a 403 on secured actions if user is authenticated and is not a member', async () => {
    const app = await exampleApp(organizationId);

    const response = await request.get(`/api/apps/${app.id}/resources/secured`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User is not a member of the app.',
        statusCode: 403,
      },
    });
  });

  it('should throw a 403 on secured actions if user is authenticated and has insufficient roles', async () => {
    const app = await exampleApp(organizationId);

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });

    const response = await request.post(
      `/api/apps/${app.id}/resources/secured`,
      {},
      {
        headers: { authorization },
      },
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
  });
});

describe('getResourceSubscription', () => {
  it('should fetch resource subscriptions', async () => {
    const app = await exampleApp(organizationId);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });
    await request.patch(
      `/api/apps/${app.id}/subscriptions`,
      {
        endpoint: 'https://example.com',
        resource: 'testResource',
        resourceId: resource.id,
        action: 'update',
        value: true,
      },
      { headers: { authorization } },
    );

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/subscriptions`,
      { headers: { authorization }, params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchObject({
      status: 200,
      data: { id: resource.id, update: true, delete: false },
    });
  });

  it('should return normally if user is not subscribed to the specific resource', async () => {
    const app = await exampleApp(organizationId);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/subscriptions`,
      { headers: { authorization }, params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchObject({
      status: 200,
      data: { id: resource.id, update: false, delete: false },
    });
  });

  it('should 404 if resource is not found', async () => {
    const app = await exampleApp(organizationId);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/0/subscriptions`,
      { headers: { authorization }, params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchObject({ status: 404, data: { message: 'Resource not found.' } });
  });

  it('should return 200 if user is not subscribed', async () => {
    const app = await exampleApp(organizationId);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/subscriptions`,
      { headers: { authorization }, params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchObject({
      status: 200,
      data: { id: app.id, update: false, delete: false },
    });
  });
});
