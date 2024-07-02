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
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
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
  await OrganizationMember.create({
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

describe('countAppResources', () => {
  it('should be able to count all resources of a type', async () => {
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

    authorizeStudio();
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

    authorizeStudio();
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
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
      AuthorId: member.id,
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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
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
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeam/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources from team members based on the member team filter as a member', async () => {
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: memberA.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: memberA.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',

      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: memberA.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
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
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userA@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: memberA.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
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
    await Resource.create({
      AppId: app.id,
      type: 'testPrivateResource',
      data: { foo: 'bar' },
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testPrivateResource/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      1
    `);
  });

  it('should not count resources from team members based on the manager team filter as not a team member', async () => {
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userA@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      AppId: app.id,
      UserId: userC.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    await TeamMember.create({ TeamId: team.id, AppMemberId: memberB.id, role: TeamRole.Member });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
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
