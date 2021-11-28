import { createFormData } from '@appsemble/node-utils';
import { Resource as ResourceType } from '@appsemble/types';
import { TeamRole } from '@appsemble/utils';
import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import webpush from 'web-push';

import {
  App,
  AppMember,
  AppSubscription,
  Asset,
  Member,
  Organization,
  Resource,
  Team,
  TeamMember,
  User,
} from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import {
  authorizeApp,
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

let organization: Organization;
let clock: Clock;
let member: Member;
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
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
              fooz: { type: 'string' },
              baz: { type: 'string' },
            },
          },
          roles: ['$public'],
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
          roles: ['$public'],
          references: {
            testResourceId: {
              resource: 'testResource',
              create: {
                trigger: ['update'],
              },
            },
          },
        },
        testResourceNone: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' } },
          },
          roles: ['$none'],
        },
        testResourceAuthorOnly: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          create: { roles: ['$author'] },
          count: { roles: ['$author'] },
          delete: { roles: ['$author'] },
          get: { roles: ['$author'] },
          query: { roles: ['$author'] },
          update: { roles: ['$author'] },
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
        testResourceTeam: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          get: { roles: ['$author', '$team:member'] },
          query: { roles: ['$team:member'] },
          count: { roles: ['$team:member'] },
          update: { roles: ['$team:member'] },
          create: { roles: ['$team:member'] },
          delete: { roles: ['$team:member'] },
        },
        testResourceTeamManager: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          query: { roles: ['$author', '$team:manager'] },
          update: { roles: ['$team:manager'] },
          create: { roles: ['$team:manager'] },
          delete: { roles: ['$team:manager'] },
        },
        testExpirableResource: {
          expires: '10m',
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: ['$public'],
        },
        testPrivateResource: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: [],
          count: {
            roles: ['$public'],
          },
        },
        testAssets: {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
              string: { type: 'string' },
            },
          },
          roles: ['$public'],
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

useTestDatabase('resources');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
  originalSendNotification = webpush.sendNotification;
});

beforeEach(async () => {
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  member = await Member.create({
    UserId: user.id,
    OrganizationId: organization.id,
    role: 'Maintainer',
  });
  clock = install();
});

afterEach(() => {
  clock.uninstall();
});

afterAll(() => {
  webpush.sendNotification = originalSendNotification;
});

describe('getResourceById', () => {
  it('should be able to fetch a resource', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should be able to fetch a resource you are a team member of', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      UserId: userB.id,
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": null,
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `,
    );
  });

  it('should not be able to fetch a resource you are not a team member of', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      UserId: userB.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be able to fetch a resources of a different app', async () => {
    const appA = await exampleApp(organization.id);
    const appB = await exampleApp(organization.id, 'app-b');

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

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return the resource author when fetching a single resource if it has one', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      UserId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "bar": 1,
        "foo": "foo",
        "id": 1,
      }
    `,
    );
  });

  it('should ignore id in the data fields', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { id: 23, foo: 'foo', bar: 1 },
      UserId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "bar": 1,
        "foo": "foo",
        "id": 1,
      }
    `,
    );
  });

  it('should not fetch expired resources', async () => {
    const app = await exampleApp(organization.id);
    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
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

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:10:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "test",
        "id": 1,
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should allow organization app editors to get resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should not allow organization members to get resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to get resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should not allow organization members to get resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('queryResources', () => {
  it('should be able to fetch all resources of a type', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);
  });

  it('should be possible to filter properties using $select', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 'foo', fooz: 'baz', baz: 'fooz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz', bar: 'fooz', fooz: 'bar', baz: 'foo' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $select: 'id,foo,bar' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "bar": "foo",
          "foo": "bar",
          "id": 1,
        },
        {
          "bar": "fooz",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);
  });

  it('should trim spaces in $select properties', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 'foo', fooz: 'baz', baz: 'fooz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz', bar: 'fooz', fooz: 'bar', baz: 'foo' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $select: '  fooz ,    baz     ' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "baz": "fooz",
          "fooz": "baz",
        },
        {
          "baz": "foo",
          "fooz": "bar",
        },
      ]
    `);
  });

  it('should ignore unknown properties in $select', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 'foo', fooz: 'baz', baz: 'fooz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz', bar: 'fooz', fooz: 'bar', baz: 'foo' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $select: 'unknown' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {},
        {},
      ]
    `);
  });

  it('should be possible to query resources without credentials with the $none role', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      UserId: user.id,
      type: 'testResourceNone',
      data: { bar: 'bar' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResourceNone`);
    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": "bar",
          "id": 1,
        },
      ]
    `,
    );
  });

  it('should be possible to query resources as author', async () => {
    const app = await exampleApp(organization.id);
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    const userB = await User.create();
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Admin' });

    await Resource.create({
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

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `,
    );
  });

  it('should only fetch resources from team members', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeam`);
    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }, { $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$author": {
            "id": Any<String>,
            "name": null,
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `,
    );
  });

  it('should only fetch resources as an author or team manager', async () => {
    const app = await exampleApp(organization.id);
    const appB = await exampleApp(organization.id, 'test-app-2');

    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const teamB = await Team.create({ name: 'Test Team 2', AppId: app.id });
    // Create a team from a different app where the user is a manager,
    // These should not be included in the result.
    const teamC = await Team.create({ name: 'Test Team different app', AppId: appB.id });

    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: teamB.id, UserId: userB.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userC.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: teamC.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: teamC.id, UserId: userC.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'foo' },
      UserId: userC.id,
    });
    await Resource.create({
      AppId: appB.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: appB.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baaar' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeamManager`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }, { $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$author": {
            "id": Any<String>,
            "name": null,
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "foo",
          "id": 3,
        },
      ]
    `,
    );
  });

  it('should be able to limit the amount of resources', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource?$top=1`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to sort fetched resources', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    clock.tick(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const responseA = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);

    const responseC = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created asc`,
    );
    expect(responseC).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);

    const responseD = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created desc`,
    );
    expect(responseD).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter fields when fetching resources', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar' } });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource?$filter=foo eq 'foo'`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "foo",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter multiple fields when fetching resources', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar', bar: 2 } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: `contains(foo, 'oo') and id le ${resource.id}` },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 1,
          "foo": "foo",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter by author', async () => {
    const app = await exampleApp(organization.id);
    const userB = await User.create();
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
      UserId: userB.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: `$author/id eq ${userB.id}` },
    });

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": null,
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 2,
          "foo": "bar",
          "id": 2,
        },
      ]
    `,
    );
  });

  it('should be able to combine multiple functions when fetching resources', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    clock.tick(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: "contains(foo, 'oo') or foo eq 'bar'", $orderby: '$updated desc' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "bar": 2,
          "foo": "bar",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 1,
          "foo": "foo",
          "id": 1,
        },
      ]
    `);
  });

  it('should return the resource author if it has one', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      UserId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 1,
          "foo": "foo",
          "id": 1,
        },
      ]
    `,
    );
  });

  it('should not fetch expired resources', async () => {
    const app = await exampleApp(organization.id);
    await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });
    await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'bar',
    });

    const responseA = await request.get(`/api/apps/${app.id}/resources/testExpirableResource`);

    // The resource A expires after 5 minutes.
    clock.tick(301e3);

    const responseB = await request.get(`/api/apps/${app.id}/resources/testExpirableResource`);

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$expires": "1970-01-01T00:05:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "test",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$expires": "1970-01-01T00:10:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 2,
        },
      ]
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$expires": "1970-01-01T00:10:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 2,
        },
      ]
    `);
  });

  it('should allow organization app editors to query resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should not allow organization members to query resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to query resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should not allow organization members to query resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should make actions private by default', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testPrivateResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testPrivateResource`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "This action is private.",
        "statusCode": 403,
      }
    `);
  });
});

describe('countResources', () => {
  it('should be able to count all resources of a type', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const responseA = await request.get(`/api/apps/${app.id}/resources/testResource/$count`);
    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/$count`,
    );

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should apply filters', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$filter=foo eq 'baz'`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources the user has access to', async () => {
    const app = await exampleApp(organization.id);
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'baz' },
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/$count`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      1
    `);
  });

  it('should only count resources from team members', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeam/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources from team members based on the member team filter as a member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=member`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources from team members based on the member team filter as a manager', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=member`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should not count resources from team members based on the member team filter as not a member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=member`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should only count resources from team members based on the manager team filter as a member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=manager`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should only count resources from team members based on the manager team filter as a manager', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=manager`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should override general action roles', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testPrivateResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testPrivateResource/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      1
    `);
  });

  it('should not count resources from team members based on the manager team filter as not a team member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    const userC = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      UserId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      UserId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      UserId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=manager`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });
});

describe('createResource', () => {
  it('should be able to create a new resource', async () => {
    const app = await exampleApp(organization.id);

    const resource = { foo: 'bar' };
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should validate resources', async () => {
    const app = await exampleApp(organization.id);

    const resource = {};
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "foo",
              "instance": {},
              "message": "requires property \\"foo\\"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "properties": {
                  "bar": {
                    "type": "string",
                  },
                  "baz": {
                    "type": "string",
                  },
                  "foo": {
                    "type": "string",
                  },
                  "fooz": {
                    "type": "string",
                  },
                },
                "required": [
                  "foo",
                ],
                "type": "object",
              },
              "stack": "instance requires property \\"foo\\"",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Validation failed for resource type testResource",
        "statusCode": 400,
      }
    `);
  });

  it('should check if an app has a specific resource definition', async () => {
    const app = await exampleApp(organization.id);

    const response = await request.get(`/api/apps/${app.id}/resources/thisDoesNotExist`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have resources called thisDoesNotExist",
        "statusCode": 404,
      }
    `);
  });

  it('should check if an app has any resource definitions', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/resources/thisDoesNotExist`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have any resources defined",
        "statusCode": 404,
      }
    `);
  });

  it('should calculate resource expiration', async () => {
    const app = await exampleApp(organization.id);
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:10:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "test",
        "id": 1,
      }
    `);
  });

  it('should set resource expiration', async () => {
    const app = await exampleApp(organization.id);
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:05:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "test",
        "id": 1,
      }
    `);
  });

  it('should not set resource expiration if given date has already passed', async () => {
    // 10 minutes
    clock.tick(600e3);

    const app = await exampleApp(organization.id);
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Expiration date has already passed.",
        "statusCode": 400,
      }
    `);
  });

  it('should accept assets as form data', async () => {
    const app = await exampleApp(organization.id);
    const response = await request.post<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 1,
      }
    `,
    );
    const assets = await Asset.findAll({ where: { ResourceId: response.data.id }, raw: true });
    expect(assets).toStrictEqual([
      {
        AppId: app.id,
        ResourceId: 1,
        UserId: null,
        created: new Date('1970-01-01T00:00:00.000Z'),
        data: expect.any(Buffer),
        filename: null,
        id: response.data.file,
        mime: 'application/octet-stream',
        name: null,
        updated: new Date('1970-01-01T00:00:00.000Z'),
      },
    ]);
    expect(Buffer.from('Test resource a').equals(assets[0].data)).toBe(true);
  });

  it('should disallow unused files', async () => {
    const app = await exampleApp(organization.id);
    const response = await request.post(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { string: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "format",
              "instance": 0,
              "message": "is not referenced from the resource",
              "name": "binary",
              "path": [
                "assets",
                0,
              ],
              "property": "instance.assets[0]",
              "stack": "instance.assets[0] is not referenced from the resource",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Validation failed for resource type testAssets",
        "statusCode": 400,
      }
    `);
  });

  it('should block unknown asset references', async () => {
    const app = await exampleApp(organization.id);
    const response = await request.post(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '1' },
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "binary",
              "instance": "1",
              "message": "does not conform to the \\"binary\\" format",
              "name": "format",
              "path": [
                "file",
              ],
              "property": "instance.file",
              "schema": {
                "format": "binary",
                "type": "string",
              },
              "stack": "instance.file does not conform to the \\"binary\\" format",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Validation failed for resource type testAssets",
        "statusCode": 400,
      }
    `);
  });

  it('should allow organization app editors to create resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `,
    );
  });

  it('should not allow organization members to create resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to create resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    await authorizeClientCredentials('resources:write');
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `,
    );
  });

  it('should not allow organization members to create resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    await authorizeClientCredentials('resources:write');
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('updateResource', () => {
  it('should be able to update an existing resource', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    clock.tick(20e3);

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:20.000Z",
        "foo": "I am not Foo.",
        "id": 1,
      }
    `);

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:20.000Z",
        "foo": "I am not Foo.",
        "id": 1,
      }
    `);
  });

  it('should be able to update an existing resource from another team', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const resource = await Resource.create({
      type: 'testResourceTeam',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      UserId: userB.id,
    });

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": null,
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am not Foo.",
        "id": 1,
      }
    `,
    );
  });

  it('should not be able to update an existing resource from another team if not part of the team', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const resource = await Resource.create({
      type: 'testResourceTeam',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      UserId: userB.id,
    });

    authorizeApp(app);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be possible to update an existing resource through another resource', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceB/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be possible to update an existing resource through another app', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await exampleApp(organization.id, 'app-b');

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be possible to update a non-existent resource', async () => {
    const app = await exampleApp(organization.id);
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/resources/testResource/0`, {
      foo: 'I am not Foo.',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should validate resources', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { bar: 123 },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "foo",
              "instance": {
                "bar": 123,
              },
              "message": "requires property \\"foo\\"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "properties": {
                  "bar": {
                    "type": "string",
                  },
                  "baz": {
                    "type": "string",
                  },
                  "foo": {
                    "type": "string",
                  },
                  "fooz": {
                    "type": "string",
                  },
                },
                "required": [
                  "foo",
                ],
                "type": "object",
              },
              "stack": "instance requires property \\"foo\\"",
            },
            {
              "argument": [
                "string",
              ],
              "instance": 123,
              "message": "is not of a type(s) string",
              "name": "type",
              "path": [
                "bar",
              ],
              "property": "instance.bar",
              "schema": {
                "type": "string",
              },
              "stack": "instance.bar is not of a type(s) string",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Validation failed for resource type testResource",
        "statusCode": 400,
      }
    `);
  });

  it('should set clonable if specified in the request', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.', $clonable: true },
    );

    await resource.reload();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am not Foo.",
        "id": 1,
      }
    `);
    expect(resource.clonable).toBe(true);
  });

  it('should set $expires', async () => {
    const app = await exampleApp(organization.id);
    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
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

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:07:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "updated",
        "id": 1,
      }
    `);

    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:07:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "updated",
        "id": 1,
      }
    `);
  });

  it('should not set $expires if the date has already passed', async () => {
    // 10 minutes
    clock.tick(600e3);

    const app = await exampleApp(organization.id);
    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    const response = await request.put(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
      {
        foo: 'updated',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Expiration date has already passed.",
        "statusCode": 400,
      }
    `);
  });

  it('should accept assets as form data', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({ AppId: app.id, type: 'testAssets' });
    const response = await request.put<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 1,
      }
    `,
    );
    const assets = await Asset.findAll({ where: { ResourceId: response.data.id }, raw: true });
    expect(assets).toStrictEqual([
      {
        AppId: app.id,
        ResourceId: 1,
        UserId: null,
        created: new Date('1970-01-01T00:00:00.000Z'),
        data: expect.any(Buffer),
        filename: null,
        id: response.data.file,
        mime: 'application/octet-stream',
        name: null,
        updated: new Date('1970-01-01T00:00:00.000Z'),
      },
    ]);
    expect(Buffer.from('Test resource a').equals(assets[0].data)).toBe(true);
  });

  it('should disallow unused assets', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({ AppId: app.id, type: 'testAssets' });
    const response = await request.put(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({
        resource: { string: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "format",
              "instance": 0,
              "message": "is not referenced from the resource",
              "name": "binary",
              "path": [
                "assets",
                0,
              ],
              "property": "instance.assets[0]",
              "stack": "instance.assets[0] is not referenced from the resource",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Validation failed for resource type testAssets",
        "statusCode": 400,
      }
    `);
  });

  it('should block unuknown asset references', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({ AppId: app.id, type: 'testAssets' });
    const response = await request.put(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({
        resource: { file: '1' },
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "binary",
              "instance": "1",
              "message": "does not conform to the \\"binary\\" format",
              "name": "format",
              "path": [
                "file",
              ],
              "property": "instance.file",
              "schema": {
                "format": "binary",
                "type": "string",
              },
              "stack": "instance.file does not conform to the \\"binary\\" format",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Validation failed for resource type testAssets",
        "statusCode": 400,
      }
    `);
  });

  it('should allow referencing existing assets', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({ AppId: app.id, type: 'testAssets' });
    const asset = await Asset.create({
      ResourceId: resource.id,
      AppId: app.id,
      data: Buffer.alloc(0),
    });
    const response = await request.put<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({ resource: { file: asset.id } }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": Any<String>,
        "id": 1,
      }
    `,
    );
    expect(response.data.file).toBe(asset.id);
  });

  it('should delete dereferenced assets', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testAssets',
      data: { file: 'test-asset' },
    });
    const asset = await Asset.create({
      id: 'test-asset',
      ResourceId: resource.id,
      AppId: app.id,
      data: Buffer.alloc(0),
    });
    const response = await request.put(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({ resource: { file: '0' }, assets: Buffer.alloc(0) }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 1,
      }
    `,
    );
    await expect(() => asset.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should allow organization app editors to update resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "baz",
        "id": 1,
      }
    `);
  });

  it('should not allow organization members to update resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to update resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "baz",
        "id": 1,
      }
    `);
  });

  it('should not allow organization members to update resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('deleteResource', () => {
  it('should be able to delete an existing resource', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const responseGetA = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetB = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetB).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should delete another team member’s resource', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const resource = await Resource.create({
      type: 'testResourceTeam',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      UserId: userB.id,
    });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not delete resources if not part of the same team', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create();
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const resource = await Resource.create({
      type: 'testResourceTeam',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      UserId: userB.id,
    });

    authorizeApp(app);
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be able to delete a non-existent resource', async () => {
    const app = await exampleApp(organization.id);
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/resources/testResource/0`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be possible to delete an existing resource through another resource', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceB/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);

    const responseGet = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);
  });

  it('should not be possible to delete an existing resource through another app', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await exampleApp(organization.id, 'app-b');
    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);

    const responseGet = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);
  });

  it('should allow organization app editors to delete resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not allow organization members to delete resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to delete resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not allow organization members to delete resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('verifyAppRole', () => {
  // The same logic gets applies to query, get, create, update, and delete.
  it('should return normally on secured actions if user is authenticated and has sufficient roles', async () => {
    const app = await exampleApp(organization.id);
    app.definition.resources.testResource.query = {
      roles: ['Reader'],
    };

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);
  });

  it('should return normally on secured actions if user is the resource author', async () => {
    const app = await exampleApp(organization.id);
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

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `,
    );
  });

  it('should return a 401 on unauthorized requests if roles are present', async () => {
    const app = await exampleApp(organization.id);

    const response = await request.get(`/api/apps/${app.id}/resources/secured`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "User is not logged in.",
        "statusCode": 401,
      }
    `);
  });

  it('should throw a 403 on secured actions if user is authenticated and is not a member', async () => {
    const app = await exampleApp(organization.id);

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/secured`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not a member of the app.",
        "statusCode": 403,
      }
    `);
  });

  it('should throw a 403 on secured actions if user is authenticated and has insufficient roles', async () => {
    const app = await exampleApp(organization.id);

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });

    authorizeApp(app);
    const response = await request.post(`/api/apps/${app.id}/resources/secured`, {});

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('getResourceSubscription', () => {
  it('should fetch resource subscriptions', async () => {
    const app = await exampleApp(organization.id);
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
    authorizeStudio();
    await request.patch(`/api/apps/${app.id}/subscriptions`, {
      endpoint: 'https://example.com',
      resource: 'testResource',
      resourceId: resource.id,
      action: 'update',
      value: true,
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/subscriptions`,
      { params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "delete": false,
        "id": 1,
        "update": true,
      }
    `);
  });

  it('should return normally if user is not subscribed to the specific resource', async () => {
    const app = await exampleApp(organization.id);
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

    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/subscriptions`,
      { params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "delete": false,
        "id": 1,
        "update": false,
      }
    `);
  });

  it('should 404 if resource is not found', async () => {
    const app = await exampleApp(organization.id);
    await AppSubscription.create({
      AppId: app.id,
      endpoint: 'https://example.com',
      p256dh: 'abc',
      auth: 'def',
    });

    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/0/subscriptions`,
      { params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found.",
        "statusCode": 404,
      }
    `);
  });

  it('should return 200 if user is not subscribed', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/subscriptions`,
      { params: { endpoint: 'https://example.com' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "delete": false,
        "id": 1,
        "update": false,
      }
    `);
  });
});
