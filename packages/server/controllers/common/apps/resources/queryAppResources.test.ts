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

describe('queryAppResources', () => {
  it('should be able to fetch all resources of a type', async () => {
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

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`);

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

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
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

  describe('verifyAppRole', () => {
    // The same logic gets applies to query, get, create, update, and delete.
    it('should return normally on secured actions if user is authenticated and has sufficient roles', async () => {
      app.definition.resources.testResource.query = {
        roles: ['Reader'],
      };

      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Reader',
        timezone: 'Europe/Amsterdam',
      });
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
      const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`);

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
      app.definition.resources.testResource.get = {
        roles: ['Admin', '$author'],
      };

      const member = await AppMember.create({
        email: user.primaryEmail,
        timezone: 'Europe/Amsterdam',
        AppId: app.id,
        UserId: user.id,
        name: user.name,
        role: 'Reader',
      });
      const resource = await Resource.create({
        AppId: app.id,
        type: 'testResource',
        data: { foo: 'bar' },
        AuthorId: member.id,
      });

      authorizeStudio();
      const response = await request.get(
        `/api/common/apps/${app.id}/resources/testResource/${resource.id}`,
      );

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
      const response = await request.get(`/api/common/apps/${app.id}/resources/secured`);

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
      authorizeApp(app);
      const response = await request.get(`/api/common/apps/${app.id}/resources/secured`);

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
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Reader',
        timezone: 'Europe/Amsterdam',
      });

      authorizeApp(app);
      const response = await request.post(`/api/common/apps/${app.id}/resources/secured`, {});

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

  it('should trim spaces in $select properties', async () => {
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

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
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

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
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
    const member = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'User',
    });
    await Resource.create({
      AppId: app.id,
      AuthorId: member.id,
      type: 'testResourceNone',
      data: { bar: 'bar' },
    });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResourceNone`);
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
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'Admin',
    });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Admin',
      timezone: 'Europe/Amsterdam',
    });

    await Resource.create({
      AppId: app.id,
      AuthorId: memberA.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      AuthorId: memberB.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    authorizeApp(app);
    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResourceAuthorOnly`,
    );

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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'Member',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: userB.id,
      name: userB.name,
      role: 'Member',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: userC.id,
      name: userC.name,
      role: 'Member',
    });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberA.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/common/apps/${app.id}/resources/testResourceTeam`);
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
    const appB = await exampleApp(organization.id, 'test-app-2');

    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const teamB = await Team.create({ name: 'Test Team 2', AppId: app.id });
    // Create a team from a different app where the user is a manager,
    // These should not be included in the result.
    const teamC = await Team.create({ name: 'Test Team different app', AppId: appB.id });

    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const appAMemberA = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'Member',
    });
    const appAMemberB = await AppMember.create({
      email: 'userB@example.com',
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: userB.id,
      name: userB.name,
      role: 'Member',
    });
    const appAMemberC = await AppMember.create({
      email: 'userC@example.com',
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: userC.id,
      name: userC.name,
      role: 'Member',
    });
    const appBMemberA = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: appB.id,
      UserId: user.id,
      name: user.name,
      role: 'Member',
    });
    const appBMemberC = await AppMember.create({
      email: 'userC@example.com',
      timezone: 'Europe/Amsterdam',
      AppId: appB.id,
      UserId: userC.id,
      name: userC.name,
      role: 'Member',
    });

    await TeamMember.create({
      TeamId: team.id,
      AppMemberId: appAMemberA.id,
      role: TeamRole.Manager,
    });
    await TeamMember.create({
      TeamId: teamB.id,
      AppMemberId: appAMemberB.id,
      role: TeamRole.Member,
    });
    await TeamMember.create({
      TeamId: team.id,
      AppMemberId: appAMemberC.id,
      role: TeamRole.Member,
    });
    await TeamMember.create({
      TeamId: teamC.id,
      AppMemberId: appBMemberA.id,
      role: TeamRole.Manager,
    });
    await TeamMember.create({
      TeamId: teamC.id,
      AppMemberId: appBMemberC.id,
      role: TeamRole.Member,
    });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'bar' },
      AuthorId: appAMemberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baz' },
      AuthorId: appAMemberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'foo' },
      AuthorId: appAMemberC.id,
    });
    await Resource.create({
      AppId: appB.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baar' },
      AuthorId: appBMemberA.id,
    });
    await Resource.create({
      AppId: appB.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baaar' },
      AuthorId: appBMemberC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResourceTeamManager`,
    );

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
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'baz' } });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource?$top=1`);

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
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=foo asc`,
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
      `/api/common/apps/${app.id}/resources/testResource?$orderby=foo desc`,
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
      `/api/common/apps/${app.id}/resources/testResource?$orderby=$created asc`,
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
      `/api/common/apps/${app.id}/resources/testResource?$orderby=$created desc`,
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

  it('should be able to sort fetched resources by a number field', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { number: 9 },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { number: 9.1 },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { number: 9.2 },
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=number asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "number": 9,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "id": 2,
          "number": 9.1,
        },
        {
          "$created": "1970-01-01T00:00:40.000Z",
          "$updated": "1970-01-01T00:00:40.000Z",
          "id": 3,
          "number": 9.2,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=number desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:40.000Z",
          "$updated": "1970-01-01T00:00:40.000Z",
          "id": 3,
          "number": 9.2,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "id": 2,
          "number": 9.1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "number": 9,
        },
      ]
    `);
  });

  it('should be able to sort fetched resources by an integer field', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { integer: 9 },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { integer: 10 },
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=integer asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "integer": 9,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "id": 2,
          "integer": 10,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=integer desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "id": 2,
          "integer": 10,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "integer": 9,
        },
      ]
    `);
  });

  it('should be able to sort fetched resources by a boolean field', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { boolean: false },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { boolean: true },
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=boolean asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "boolean": false,
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "boolean": true,
          "id": 2,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=boolean desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "boolean": true,
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "boolean": false,
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to sort fetched resources by an enum field', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { enum: 'A' },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { enum: 'B' },
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=enum asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "enum": "A",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "enum": "B",
          "id": 2,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=enum desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "enum": "B",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "enum": "A",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to sort fetched resources by a date field', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { date: '2023-05-14' },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { date: '2024-04-14' },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { date: '2024-04-15' },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { date: '2024-05-14' },
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=date asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "date": "2023-05-14",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "date": "2024-04-14",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:40.000Z",
          "$updated": "1970-01-01T00:00:40.000Z",
          "date": "2024-04-15",
          "id": 3,
        },
        {
          "$created": "1970-01-01T00:01:00.000Z",
          "$updated": "1970-01-01T00:01:00.000Z",
          "date": "2024-05-14",
          "id": 4,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$orderby=date desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:01:00.000Z",
          "$updated": "1970-01-01T00:01:00.000Z",
          "date": "2024-05-14",
          "id": 4,
        },
        {
          "$created": "1970-01-01T00:00:40.000Z",
          "$updated": "1970-01-01T00:00:40.000Z",
          "date": "2024-04-15",
          "id": 3,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "date": "2024-04-14",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "date": "2023-05-14",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter fields when fetching resources', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar' } });

    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResource?$filter=foo eq 'foo'`,
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
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar', bar: 2 } });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
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
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'Member',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: userB.id,
      name: userB.name,
      role: 'Member',
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
      AuthorId: memberB.id,
    });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
      params: { $filter: `$author/id eq ${memberB.id}` },
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
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    vi.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
    });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
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

  it('should return the resource authors if it has them', async () => {
    const member = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      role: 'Member',
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      AuthorId: member.id,
      EditorId: member.id,
    });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) }, $editor: { id: expect.any(String) } }] },
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
          "$editor": {
            "id": Any<String>,
            "name": "Test User",
          },
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
    await request.post<ResourceType>(`/api/common/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });
    await request.post<ResourceType>(`/api/common/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'bar',
    });

    const responseA = await request.get(
      `/api/common/apps/${app.id}/resources/testExpirableResource`,
    );

    // The resource A expires after 5 minutes.
    vi.advanceTimersByTime(301e3);

    const responseB = await request.get(
      `/api/common/apps/${app.id}/resources/testExpirableResource`,
    );

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
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResourceAuthorOnly`,
    );

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
    await orgMember.update({
      role: 'Member',
    });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResourceAuthorOnly`,
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

  it('should allow organization app editors to query resources using client credentials', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResourceAuthorOnly`,
    );
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
    await orgMember.update({
      role: 'Member',
    });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(
      `/api/common/apps/${app.id}/resources/testResourceAuthorOnly`,
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

  it('should make actions private by default', async () => {
    await Resource.create({
      AppId: app.id,
      type: 'testPrivateResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/common/apps/${app.id}/resources/testPrivateResource`);
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

  it('should be able to fetch a resource view', async () => {
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
    await Resource.create({ AppId: app.id, type: 'testResource', data: { bar: 'baz' } });

    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    authorizeApp(app);
    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
      params: { view: 'testView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "name": "1-bar",
          "randomValue": "Some random value",
        },
        {
          "name": "2-baz",
          "randomValue": "Some random value",
        },
        {
          "name": "3-",
          "randomValue": "Some random value",
        },
      ]
    `);
  });

  it('should be able to fetch a public resource view', async () => {
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
    await Resource.create({ AppId: app.id, type: 'testResource', data: { bar: 'baz' } });

    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
      params: { view: 'publicView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
          "public": true,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
          "public": true,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": "baz",
          "id": 3,
          "public": true,
        },
      ]
    `);
  });

  it('should return 404 for non-existing resource views', async () => {
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    authorizeApp(app);
    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
      params: { view: 'missingView' },
    });

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
    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
      params: { view: 'testView' },
    });

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
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Visitor',
      timezone: 'Europe/Amsterdam',
    });
    authorizeApp(app);
    const response = await request.get(`/api/common/apps/${app.id}/resources/testResource`, {
      params: { view: 'testView' },
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

  it('should return clonable field if app is a template app', async () => {
    app.update({ template: true });
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'bar' },
    });

    authorizeStudio();
    const response1 = await request.get(`/api/common/apps/${app.id}/resources/testResource`);
    expect(response1).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$clonable": false,
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);

    resource.clonable = true;
    await resource.save();

    const response2 = await request.get(`/api/common/apps/${app.id}/resources/testResource`);
    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$clonable": true,
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });
});
