import { type Resource as ResourceType } from '@appsemble/types';
import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  AppMember,
  Organization,
  OrganizationMember,
  Resource,
  Team,
  TeamMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeApp,
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let orgMember: OrganizationMember;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
  originalSendNotification = webpush.sendNotification;
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
  orgMember = await OrganizationMember.create({
    UserId: user.id,
    OrganizationId: organization.id,
    role: 'Maintainer',
  });
  app = await exampleApp(organization.id);
});

afterAll(() => {
  webpush.sendNotification = originalSendNotification;
  vi.useRealTimers();
});

describe('getAppResourceById', () => {
  it('should be able to fetch a resource', async () => {
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

  it('should be able to fetch a resource view', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'testView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "name": "1-bar",
        "randomValue": "Some random value",
      }
    `);
  });

  it('should be able to fetch a public resource view', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'publicView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
        "public": true,
      }
    `);
  });

  it('should return 404 for non-existing resource views', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'missingView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "View missingView does not exist for resource type testResource",
        "statusCode": 404,
      }
    `);
  });

  it('should check for authentication when using resource views', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'testView' } },
    );

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

  it('should check for the correct role when using resource views', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Visitor',
      timezone: 'Europe/Amsterdam',
    });
    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'testView' } },
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

  it('should be able to fetch a resource you are a team member of', async () => {
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const member1 = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const member2 = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: member1.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, AppMemberId: member2.id, role: TeamRole.Member });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: member2.id,
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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({
      timezone: 'Europe/Amsterdam',
      primaryEmail: 'userB@example.com',
    });
    const memberB = await AppMember.create({
      email: userB.primaryEmail,
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: memberB.id,
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
    const appB = await exampleApp(organization.id, 'app-b');

    const resource = await Resource.create({
      AppId: app.id,
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
    const member = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'User',
    });
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      AuthorId: member.id,
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
    const member = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'User',
    });
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { id: 23, foo: 'foo', bar: 1 },
      AuthorId: member.id,
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
    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    const responseA = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    // The resource expires after 10 minutes.
    vi.advanceTimersByTime(601e3);

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
    await orgMember.update({
      role: 'Member',
    });

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
    await orgMember.update({
      role: 'Member',
    });

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
